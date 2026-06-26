# DATAhub — Plan de Déploiement Production

## Infrastructure cible
- VPS Ubuntu 22.04 LTS (4 vCPU, 8 GB RAM minimum)
- Nginx (reverse proxy + SSL termination)
- PM2 (process manager Node.js)
- PostgreSQL 15+ (base de données principale)
- Redis 7+ (cache + Bull Queue)
- Let's Encrypt (SSL via Certbot)

---

## 1. Préparation du serveur

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Dépendances
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server && sudo systemctl start redis-server
```

---

## 2. Base de données PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE datahub;
CREATE USER datahub_user WITH ENCRYPTED PASSWORD 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE datahub TO datahub_user;
\q

# Migrations Prisma
cd /var/www/datahub/backend
npx prisma migrate deploy
npx prisma generate
```

---

## 3. Variables d'environnement

```bash
cp /var/www/datahub/backend/.env.example /var/www/datahub/backend/.env
nano /var/www/datahub/backend/.env
# Remplir toutes les variables (DB, JWT, OAuth, SMTP, etc.)
```

---

## 4. Build et déploiement

```bash
# Backend
cd /var/www/datahub/backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# Frontend
cd /var/www/datahub/frontend
npm install
npm run build
# Les fichiers build/ sont servis par Nginx
```

---

## 5. Configuration Nginx

```nginx
# /etc/nginx/sites-available/datahub
server {
    listen 80;
    server_name datahub.app www.datahub.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name datahub.app www.datahub.app;

    ssl_certificate /etc/letsencrypt/live/datahub.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/datahub.app/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Frontend React (SPA)
    location / {
        root /var/www/datahub/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/datahub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL Let's Encrypt
sudo certbot --nginx -d datahub.app -d www.datahub.app
```

---

## 6. PM2 (process manager)

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'datahub-api',
    script: './src/server.js',
    cwd: '/var/www/datahub/backend',
    instances: 2,          // Cluster mode
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 5000 },
    max_memory_restart: '1G',
    error_file: './logs/pm2-err.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

---

## 7. Firewall UFW

```bash
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw deny 5000/tcp    # API — accès interne uniquement
sudo ufw deny 5432/tcp    # PostgreSQL — interne
sudo ufw deny 6379/tcp    # Redis — interne
sudo ufw enable
```

---

## 8. Backups automatiques

```bash
# /etc/cron.d/datahub-backup
0 3 * * * postgres pg_dump datahub | gzip > /backups/datahub-$(date +\%Y\%m\%d).sql.gz
# Garder 30 derniers jours
find /backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

## 9. Monitoring

- **UptimeRobot** : surveillance uptime HTTP/HTTPS
- **Sentry** : tracking erreurs JavaScript (frontend + backend)
- **PM2 Monit** : `pm2 monit` pour CPU/RAM temps réel
- **Logs** : `pm2 logs datahub-api --lines 100`

---

## 10. CI/CD GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy DATAhub

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/datahub
            git pull origin main
            cd backend && npm install --production
            npx prisma migrate deploy
            cd ../frontend && npm install && npm run build
            pm2 restart datahub-api
```

---

## Checklist de mise en production

- [ ] Variables `.env` configurées avec clés production
- [ ] Certificat SSL installé et renouvelé automatiquement
- [ ] Migrations Prisma appliquées
- [ ] PM2 démarré en mode cluster
- [ ] Nginx configuré avec headers de sécurité
- [ ] Firewall UFW actif
- [ ] Backups quotidiens configurés
- [ ] UptimeRobot surveillant l'endpoint `/health`
- [ ] Sentry DSN configuré frontend + backend
- [ ] OAuth apps configurées avec URLs de callback production
- [ ] Clé Flutterwave production active
