# VPS Deployment Guide (Docker + Nginx)

This guide covers the complete process to deploy the **HandisCV** application on a Linux VPS (Ubuntu 20.04/22.04 recommended).

## Prerequisites

- A domain name pointing to your VPS IP address.
- A VPS with at least 2GB RAM (or 1GB with Swap enabled).
- Root or sudo access.

---

## 1. Server Preparation

### 1.1. System Updates & Dependencies
Connect to your VPS and install Docker, Nginx, and Certbot.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Nginx & Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Allow traffic (if UFW enabled)
sudo ufw allow 'Nginx Full'
```

### 1.2. Create Swap (Recommended for low RAM)
If your VPS has < 4GB RAM, creates a 2GB swap file to prevent build crashes.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 2. Project Setup

### 2.1. Clone Repository
```bash
# Setup directory ensure permissions
sudo mkdir -p /var/www/cvmaker
sudo chown -R $USER:$USER /var/www/cvmaker

# Clone (replace with your repo URL)
git clone <your-repo-url> /var/www/cvmaker
cd /var/www/cvmaker
```

### 2.2. Environment Configuration
Create the production `.env` file.

```bash
cp .env.example .env
nano .env
```

**Critical Variables to Set:**
```ini
NODE_ENV=production
APP_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# Database (match docker-compose)
DATABASE_URL=postgresql://user:password@postgres:5432/cvmaker?schema=public

# Security
JWT_SECRET=your_super_secure_secret
JWT_EXPIRES_IN=7d

# Frontend (Required for Build)
VITE_API_URL=https://yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_ID=...

# APIs (Paymob, OpenRouter, Resend)
...

# Admin Seeding
ADMIN_EMAIL=admin@handiscv.com
ADMIN_PASSWORD=your_secure_password
```

---

## 3. Deployment

### 3.1. Build Frontend (Static Assets)
The React frontend must be built. You can do this on the VPS or upload from local.

**Option A: Build on VPS (Easiest)**
```bash
cd client
npm install
npm run build
cd ..
```
*Output will be in `client/dist`.*

**Option B: Upload from Local**
Build locally, then SCP:
```bash
# Local machine
cd client
npm run build
scp -r dist/* user@your-vps-ip:/var/www/cvmaker/client/dist/
```

### 3.2. Start Backend Services
Run the backend API and Database using Docker Compose.

```bash
docker compose up -d --build
```

Note: `docker-compose.yml` currently includes a top-level `version:` field. Newer Docker Compose ignores it and may print a warning; it’s safe to remove.

### 3.3. Database Initialization
Push the Prisma schema to the production database and seed initial data.

```bash
# Push schema
docker compose exec server npx prisma db push

# Seed data (Admin/Recruiter accounts)
docker compose exec server npx prisma db seed
```

If you `git pull` updates that change backend dependencies or Prisma config, always rebuild the server image:
```bash
docker compose up -d --build server
```

Seed creates (or updates) the **Admin** account based on your `.env` variables:
- Admin Role (`ADMIN`)
- Email: Checks `ADMIN_EMAIL` in `.env`
- Password: Checks `ADMIN_PASSWORD` in `.env`

If these variables are missing, the seed script will fail.

---

## 4. Nginx Configuration (Reverse Proxy & SSL)

### 4.1. Configure Nginx
Copy the project's nginx config to the system directory.

```bash
sudo cp nginx/cvmaker.conf /etc/nginx/sites-available/cvmaker
sudo nano /etc/nginx/sites-available/cvmaker
```

**Update the config:**
- Change `server_name handiscv.muhandis.software` to your actual domain.
- Ensure `root` paths match your directory (`/var/www/cvmaker/client/dist`).

### 4.2. Enable Site
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/cvmaker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.3. Setup SSL (HTTPS)
Use Certbot to automatically configure SSL.

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Maintenance & Updates

### Updating the App
```bash
cd /var/www/cvmaker
git pull
# If frontend changed:
cd client && npm install && npm run build && cd ..
# If backend changed:
docker compose up -d --build
# If schema changed:
docker compose exec server npx prisma db push
```

### View Logs
```bash
docker compose logs -f server
```

### Restart Services
```bash
docker compose restart
```

---
