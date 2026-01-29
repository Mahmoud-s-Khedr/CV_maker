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

Run the Docker stack in detached mode:

```bash
docker-compose up -d --build
```

## 4. Nginx Reverse Proxy (SSL)

To expose the app and the API over HTTPS, use Nginx as a reverse proxy:

1.  **Create Nginx Config**:
    `sudo nano /etc/nginx/sites-available/cvmaker`

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2.  **Enable Site and Get SSL**:
```bash
sudo ln -s /etc/nginx/sites-available/cvmaker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

## 5. Maintenance

- **Update Code**: `git pull && docker-compose up -d --build`
- **View Logs**: `docker-compose logs -f`
- **Database Backup**: 
  ```bash
  docker-compose exec postgres pg_dump -U user cvmaker > backup.sql
  ```

---

### Troubleshooting Google Auth on VPS
Ensure your domain (`https://yourdomain.com`) is added to:
1.  **Authorized JavaScript origins** in Google Cloud Console.
2.  **Authorized redirect URIs** in Google Cloud Console.
3.  **CORS_ORIGINS** in your `.env` file.
