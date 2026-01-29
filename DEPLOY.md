# VPS Deployment Guide (Docker)

This guide explains how to deploy the **CV Maker** stack on a single Virtual Private Server (VPS) using Docker Compose and Nginx.

## 1. Server Preparation

Connect to your VPS and install the necessary dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Nginx & Certbot (for SSL)
sudo apt install nginx certbot python3-certbot-nginx -y

# Allow Nginx through firewall (if UFW is enabled)
sudo ufw allow 'Nginx Full'
```

## 2. Project Setup

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url> /var/www/cvmaker
    cd /var/www/cvmaker
    ```

2.  **Configure Environment**:
    Create the root `.env` file from the template:
    ```bash
    cp .env.example .env
    nano .env
    ```
    Ensure you set:
    - `NODE_ENV=production`
    - `CORS_ORIGINS=https://yourdomain.com`
    - `APP_URL=https://yourdomain.com`
    - `VITE_API_URL=https://yourdomain.com/api`
    - `VITE_GOOGLE_CLIENT_ID` (and the backend equivalent)
    - All other API keys (Paymob, OpenRouter, Resend)

## 3. Deployment


### 3.1. Build the Frontend (Client)

On your local machine or VPS:

```bash
cd client
npm install
npm run build
# The production build will be in client/dist
```

Copy the build output to your server (if building locally). **Note: You only need the `dist` folder contents for the server; `node_modules` is not required for the frontend.**

```bash
scp -r client/dist/* <your-vps-user>@<your-vps-ip>:/var/www/cvmaker/client/dist/
```

Or, if building on the VPS, just ensure `/var/www/cvmaker/client/dist` contains the latest build.

### 3.2. Start Backend and Database

Run the Docker stack (backend and database only):

```bash
docker-compose up -d --build
```

## 4. Nginx Reverse Proxy (SSL)

To expose the app and the API over HTTPS, use Nginx as a reverse proxy:

1.  **Copy Nginx Config Template**:
    ```bash
    sudo cp /var/www/cvmaker/nginx/cvmaker.conf /etc/nginx/sites-available/cvmaker
    sudo nano /etc/nginx/sites-available/cvmaker
    ```

    **Replace `handiscv.muhandis.software` (or `yourdomain.com`) with your actual domain**. 
    
    The provided configuration is **HTTP-only** by default to prevent SSL errors before certificates are generated. Certbot will upgrade it to HTTPS automatically in the next step.

    The config includes:
    - Serves static frontend files from `/var/www/cvmaker/client/dist` at `/`
    - Proxies backend API (port 4000) at `/api`
    - Basic security headers
    - Gzip compression
    - Proper proxy headers (X-Forwarded-*, etc.)

2.  **Enable Site and Get SSL**:
    ```bash
    # Remove default Nginx site (prevent conflicts)
    sudo rm -f /etc/nginx/sites-enabled/default

    sudo ln -s /etc/nginx/sites-available/cvmaker /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    sudo certbot --nginx -d yourdomain.com
    ```

    Certbot will automatically:
    - Obtain a Let's Encrypt SSL certificate
    - Configure HTTPS on port 443
    - Update the Nginx config with SSL paths
    - Set up auto-renewal

3.  **Verify SSL (optional)**:
    ```bash
    sudo certbot certificates
    ```

4.  **Set up Auto-renewal** (usually automatic with Certbot):
    ```bash
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    ```

## 5. Maintenance

- **Update Code**: `git pull && docker-compose up -d --build`
- **View Logs**: `docker-compose logs -f`
- **Database Backup**: 
  ```bash
  docker-compose exec postgres pg_dump -U user cvmaker > backup.sql
  ```

---

## Troubleshooting

### Google Auth on VPS
Ensure your domain (`https://yourdomain.com`) is added to:
1.  **Authorized JavaScript origins** in Google Cloud Console.
2.  **Authorized redirect URIs** in Google Cloud Console.
3.  **CORS_ORIGINS** in your `.env` file.

### Nginx Issues

**Nginx syntax error**:
```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

**Port conflicts** (if ports 80/443 already in use):
- Stop other services: `sudo lsof -i :80` and `sudo lsof -i :443`
- Check Docker container ports: `docker-compose ps`

**SSL certificate errors**:
```bash
sudo certbot renew --dry-run  # Test renewal
sudo certbot certificates     # Check certificate status
```


**Docker container connectivity**:
```bash
docker-compose logs server   # View backend logs
docker exec -it <container_id> /bin/sh  # Access container shell
```

**Check Nginx logs**:
```bash
sudo tail -f /var/log/nginx/cvmaker_access.log
sudo tail -f /var/log/nginx/cvmaker_error.log
```
