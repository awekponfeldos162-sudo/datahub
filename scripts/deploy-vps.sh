#!/bin/bash
# DATAhub — Script de déploiement VPS automatisé
# Usage: ./scripts/deploy-vps.sh [domain] [email]
# Exemple: ./scripts/deploy-vps.sh datahub.mondomaine.com admin@exemple.com

set -euo pipefail

DOMAIN="${1:-datahub.example.com}"
EMAIL="${2:-admin@example.com}"
APP_DIR="/var/www/datahub"
REPO_URL="${REPO_URL:-https://github.com/VOTRE_USER/datahub.git}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }

[ "$(id -u)" -ne 0 ] && error "Exécuter en root: sudo $0"

log "=== DATAhub VPS Deployment ==="
log "Domaine: $DOMAIN | Email: $EMAIL"

# ─── Mise à jour système ───────────────────────────────────────
log "1/9 Mise à jour du système..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── Dépendances système ───────────────────────────────────────
log "2/9 Installation des dépendances..."
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw fail2ban

# ─── Node.js 20 ───────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  log "Installation Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ─── PM2 ──────────────────────────────────────────────────────
npm install -g pm2 &>/dev/null
log "PM2: $(pm2 -v)"

# ─── Docker (optionnel) ───────────────────────────────────────
if ! command -v docker &>/dev/null; then
  log "Installation Docker..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$SUDO_USER" 2>/dev/null || true
fi

# ─── PostgreSQL ───────────────────────────────────────────────
log "3/9 Configuration PostgreSQL..."
if ! command -v psql &>/dev/null; then
  apt-get install -y postgresql-15
  systemctl enable postgresql
  systemctl start postgresql
fi

# ─── Redis ────────────────────────────────────────────────────
log "4/9 Configuration Redis..."
if ! command -v redis-cli &>/dev/null; then
  apt-get install -y redis-server
  systemctl enable redis-server
  systemctl start redis-server
fi

# ─── Clone/Update code ────────────────────────────────────────
log "5/9 Déploiement du code..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── Backend ──────────────────────────────────────────────────
log "6/9 Installation backend..."
cd "$APP_DIR/backend"
npm ci --only=production
npx prisma generate
npx prisma migrate deploy

# ─── Frontend ─────────────────────────────────────────────────
log "7/9 Build frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

# ─── Nginx ────────────────────────────────────────────────────
log "8/9 Configuration Nginx..."
cat > /etc/nginx/sites-available/datahub <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend
    location / {
        root $APP_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
    }

    # Static assets — long cache
    location ~* \.(js|css|png|jpg|svg|woff2?)$ {
        root $APP_DIR/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/datahub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── SSL Let's Encrypt ────────────────────────────────────────
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  log "Obtention certificat SSL..."
  certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
fi

# ─── UFW Firewall ─────────────────────────────────────────────
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw deny 5000 2>/dev/null || true

# ─── PM2 startup ──────────────────────────────────────────────
log "9/9 Démarrage PM2..."
cd "$APP_DIR/backend"
pm2 delete datahub-api 2>/dev/null || true
pm2 start src/server.js --name datahub-api --instances 2 --exec-mode cluster \
  --max-memory-restart 512M \
  --env production
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# ─── Cron de renouvellement SSL ───────────────────────────────
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | sort -u | crontab -

# ─── Cron de sauvegarde PostgreSQL ───────────────────────────
mkdir -p /var/backups/datahub
(crontab -l 2>/dev/null; echo "0 2 * * * pg_dump -U datahub_user datahub | gzip > /var/backups/datahub/db_\$(date +\%Y\%m\%d).sql.gz && find /var/backups/datahub -name '*.gz' -mtime +7 -delete") | sort -u | crontab -

log ""
log "✅ DATAhub déployé avec succès!"
log "   URL: https://$DOMAIN"
log "   API: https://$DOMAIN/api"
log "   Health: https://$DOMAIN/health"
log ""
log "Prochaines étapes:"
log "  1. Configurez votre .env en production: $APP_DIR/backend/.env"
log "  2. Vérifiez PM2: pm2 status"
log "  3. Logs: pm2 logs datahub-api"
