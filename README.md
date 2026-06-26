# DATAhub — Plateforme d'Analyse Multi-Réseaux Sociaux

**Version 1.0 | Juin 2025 | Confidentiel**

Centralisez Facebook, YouTube, Instagram, TikTok et Snapchat dans un seul tableau de bord analytique. Solution conçue pour le marché africain francophone.

---

## Architecture du projet

```
datahub/
├── backend/          Node.js + Express + Prisma + PostgreSQL
├── frontend/         React 18 + Vite + Tailwind CSS + Recharts
├── DEPLOYMENT.md     Plan de déploiement VPS production
└── README.md         Ce fichier
```

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Vite, Tailwind CSS 3, Recharts, Framer Motion, Zustand, React Query |
| Backend | Node.js 20 LTS, Express 4, Passport.js, JWT (RS256) |
| Base de données | PostgreSQL 15, Prisma ORM 5 |
| Cache & Queue | Redis 7, Bull Queue, node-cron |
| Sécurité | AES-256-GCM, bcrypt (cost 12), Helmet.js, CSRF, Rate limiting |
| Rapports | PDFKit, ExcelJS |
| Email | Nodemailer / SendGrid |
| Paiement | Flutterwave (Mobile Money + Cartes) |
| Infra | VPS Ubuntu 22.04, Nginx, PM2, Let's Encrypt |

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend

```bash
cd backend
cp .env.example .env
# Éditez .env avec vos variables

npm install
npx prisma generate
npx prisma migrate dev

npm run dev
# API disponible sur http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App disponible sur http://localhost:3000
```

---

## Variables d'environnement (Backend)

Copiez `backend/.env.example` → `backend/.env` et remplissez :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET` | Clé secrète JWT (min 32 chars) |
| `ENCRYPTION_KEY` | Clé AES-256 (64 chars hex) |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth Google |
| `FACEBOOK_APP_ID/SECRET` | OAuth Facebook |
| `YOUTUBE_CLIENT_ID/SECRET` | YouTube Data API v3 |
| `INSTAGRAM_CLIENT_ID/SECRET` | Instagram Basic Display API |
| `TIKTOK_CLIENT_KEY/SECRET` | TikTok Display API |
| `SNAPCHAT_CLIENT_ID/SECRET` | Snapchat Marketing API |
| `FLUTTERWAVE_SECRET_KEY` | Clé Flutterwave (paiement) |
| `SMTP_*` | Configuration email |

---

## Schéma de base de données

```
users (id, email, password_hash, full_name, plan, email_verified, created_at)
  └── platform_accounts (id, user_id, platform, access_token_enc, refresh_token_enc, token_expires_at)
        └── posts (id, platform_account_id, platform_post_id, type, title, published_at, url)
              └── metrics (id, post_id, metric_date, views, likes, comments, shares, reach, engagement_rate)
  └── reports (id, user_id, title, period_start, period_end, platforms, format, file_url, generated_at)
  └── subscriptions (id, user_id, plan, status, current_period_start, current_period_end, amount)
  └── audit_logs (id, user_id, action, resource, ip_address, created_at)
```

---

## API Endpoints

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| GET | `/api/auth/verify/:token` | Vérifier email |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| GET | `/api/auth/google` | OAuth Google |
| GET | `/api/auth/profile` | Profil utilisateur |

### Plateformes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/platforms` | Comptes connectés |
| POST | `/api/platforms/connect` | Connecter une plateforme |
| DELETE | `/api/platforms/:platform` | Déconnecter |
| POST | `/api/platforms/:platform/sync` | Synchroniser les données |

### Métriques
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/metrics/overview?period=30d` | Dashboard global |
| GET | `/api/metrics/platform/:platform` | Analytics par plateforme |
| GET | `/api/metrics/top-posts` | Top publications |
| GET | `/api/metrics/heatmap` | Heatmap d'engagement |
| GET | `/api/metrics/compare` | Comparaison multi-plateformes |

### Rapports
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reports` | Historique |
| POST | `/api/reports/generate` | Générer PDF/Excel |

### Recommandations IA
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/insights` | Recommandations & alertes |

### Paiement
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/payment/plans` | Plans disponibles |
| POST | `/api/payment/initialize` | Démarrer paiement |
| POST | `/api/payment/webhook` | Webhook Flutterwave |

---

## Sécurité

- **AES-256-GCM** : tous les tokens OAuth chiffrés avant stockage
- **JWT RS256** : access token 24h + refresh token 7j
- **bcrypt cost 12** : aucun mot de passe en clair
- **Helmet.js** : headers de sécurité HTTP (XSS, CSP, HSTS)
- **Rate limiting** : 100 req/min global, 10 req/15min sur /auth
- **HTTPS TLS 1.3** : obligatoire en production

---

## Plans tarifaires

| Plan | Prix | Plateformes | Historique | Rapports |
|------|------|-------------|-----------|---------|
| Free | 0 FCFA | 1 | 30j | 2/mois |
| Starter | 5 000 FCFA | 3 | 90j | 10/mois |
| Pro | 15 000 FCFA | 5 | 12 mois | Illimité + IA |
| Enterprise | Sur devis | Illimité | Personnalisé | API privée |

**Paiement** : MTN Mobile Money, Wave, Moov Money, Orange Money, Visa, Mastercard (via Flutterwave / CinetPay)

---

## Pages de l'application

| Route | Accès | Description |
|-------|-------|-------------|
| `/` | Public | Page d'accueil |
| `/signup` | Public | Inscription |
| `/login` | Public | Connexion |
| `/dashboard` | Privé | Tableau de bord global |
| `/analytics/:platform` | Privé | Analytics par plateforme |
| `/compare` | Privé | Comparaison multi-plateformes |
| `/reports` | Privé (Starter+) | Génération de rapports |
| `/insights` | Privé (Starter+) | Recommandations IA |
| `/settings` | Privé | Paramètres & connexions OAuth |
| `/pricing` | Privé | Plans & paiement |

---

## Parcours utilisateur

1. **Inscription** — email ou OAuth Google
2. **Vérification** — confirmation email + onboarding
3. **Connexion RS** — OAuth 2.0 par plateforme
4. **Collecte auto** — 30 derniers jours importés
5. **Dashboard** — métriques et graphiques
6. **Rapport** — PDF/Excel en 1 clic
7. **Insights** — recommandations IA
8. **Abonnement** — upgrade et paiement local

---

## Documentation utilisateur

### Se connecter à une plateforme

1. Aller dans **Paramètres**
2. Cliquer sur **Connecter** à côté de la plateforme souhaitée
3. Vous êtes redirigé vers la page OAuth de la plateforme
4. Autoriser DATAhub à lire vos statistiques
5. Revenir automatiquement sur DATAhub — compte connecté !

### Générer un rapport

1. Aller dans **Rapports**
2. Renseigner le titre, les dates de début/fin
3. Sélectionner les plateformes à inclure
4. Choisir le format (PDF ou Excel)
5. Cliquer sur **Générer et télécharger**

### Interpréter les recommandations IA

Les recommandations sont générées automatiquement à partir de vos 90 derniers jours de données :
- **Meilleurs horaires** : basés sur l'engagement moyen par heure
- **Types de contenu** : classement des formats (vidéo, image, texte)
- **Alertes** : baisse d'engagement détectée, tokens expirés
- **Fréquence** : recommandation de publication idéale

---

*Contact : contact@datahub.app | Version 1.0 — Confidentiel*
