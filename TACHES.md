# DATAhub — Cahier des tâches

## Architecture du projet

```
datahub/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          Schéma DB (User, PlatformAccount, Post, Metric, Report, Subscription, FollowerSnapshot, AuditLog)
│   │   └── migrations/            Migrations PostgreSQL
│   └── src/
│       ├── config/
│       │   ├── passport.js        Stratégies JWT + Google OAuth
│       │   └── redis.js           Cache Redis (optionnel)
│       ├── controllers/
│       │   ├── authController.js  Inscription, connexion, MFA, reset password
│       │   ├── mfaController.js   TOTP (speakeasy + qrcode)
│       │   ├── metricsController.js  Dashboard, analytics, heatmap, comparaison
│       │   ├── platformController.js Connexion/déconnexion/sync plateformes + token refresh
│       │   ├── reportsController.js  Génération PDF/Excel
│       │   └── insightsController.js Recommandations IA
│       ├── middleware/
│       │   ├── auth.js            authenticate, requirePlan, requireAdmin, generateTokens
│       │   ├── validate.js        Zod validation + exposeFields (public/privé)
│       │   ├── rateLimiter.js     Rate limiting (global + auth)
│       │   └── errorHandler.js    Gestion erreurs (messages génériques production)
│       ├── routes/
│       │   ├── auth.js            /api/auth/* (login, register, OAuth Google, YouTube, Pinterest)
│       │   ├── platforms.js       /api/platforms/*
│       │   ├── metrics.js         /api/metrics/*
│       │   ├── reports.js         /api/reports/*
│       │   ├── insights.js        /api/insights/*
│       │   ├── payment.js         /api/payment/* (Flutterwave + CinetPay)
│       │   └── admin.js           /api/admin/* (pour futur site admin séparé)
│       ├── services/
│       │   ├── cryptoService.js   AES-256-GCM chiffrement/déchiffrement
│       │   ├── emailService.js    Nodemailer / SendGrid
│       │   ├── youtubeService.js  YouTube Data API v3 + Analytics API
│       │   ├── pinterestService.js Pinterest API v5
│       │   ├── facebookService.js Facebook Graph API
│       │   ├── instagramService.js Instagram Basic Display API
│       │   ├── tiktokService.js   TikTok Display API
│       │   └── snapchatService.js Snapchat Marketing API
│       └── utils/
│           ├── logger.js          Winston (console + fichiers logs/)
│           └── jobs.js            Cron jobs (sync 6h, rapports lundi 8h, nettoyage 2h)
├── frontend/
│   └── src/
│       ├── api/
│       │   └── client.js          Axios + intercepteurs JWT auto-refresh
│       ├── components/
│       │   ├── charts/
│       │   │   ├── ChartExportButton.jsx  Export PNG graphiques
│       │   │   └── EngagementHeatmap.jsx  Heatmap 7j × 24h (WCAG AA)
│       │   ├── dashboard/
│       │   │   └── StatsCard.jsx  Carte KPI avec variation %
│       │   ├── icons/
│       │   │   └── PinterestIcon.jsx  Icône SVG Pinterest
│       │   └── layout/
│       │       ├── Sidebar.jsx    Navigation latérale (toutes plateformes)
│       │       └── Layout.jsx     Wrapper pages privées
│       ├── pages/
│       │   ├── Landing.jsx        Page d'accueil publique
│       │   ├── Login.jsx          Connexion (email + Google OAuth)
│       │   ├── Signup.jsx         Inscription
│       │   ├── AuthCallback.jsx   Callback OAuth (tokens via hash fragment)
│       │   ├── VerifyEmail.jsx    Vérification email
│       │   ├── ForgotPassword.jsx Mot de passe oublié
│       │   ├── ResetPassword.jsx  Réinitialisation mot de passe
│       │   ├── Dashboard.jsx      Tableau de bord global
│       │   ├── Analytics.jsx      Analytics par plateforme (/analytics/:platform)
│       │   ├── Compare.jsx        Comparaison multi-plateformes
│       │   ├── Heatmap.jsx        Heatmap engagement horaire (WCAG AA)
│       │   ├── Reports.jsx        Génération rapports PDF/Excel
│       │   ├── Insights.jsx       Recommandations IA
│       │   ├── Settings.jsx       Profil + MFA + OAuth plateformes + danger zone
│       │   ├── Pricing.jsx        Plans tarifaires + paiement
│       │   ├── PaymentCallback.jsx Retour paiement (vérifie plan via DB)
│       │   └── NotFound.jsx       404
│       └── store/
│           └── useStore.js        Zustand (auth, UI, settings)
├── TACHES.md     Ce fichier
├── STATUT.md     État actuel du projet
├── README.md     Documentation technique
└── DEPLOYMENT.md Plan déploiement VPS production
```

---

## Plateformes sociales

| Plateforme | OAuth | Service API | Sync | Analytics quotidiens | Credentials |
|------------|-------|-------------|------|----------------------|-------------|
| YouTube    | ✅    | ✅          | ✅   | ✅ (Analytics API)   | ✅ Configuré |
| Pinterest  | ✅    | ✅          | ✅   | ✅ (Analytics API v5)| ⏳ À ajouter dans .env |
| Facebook   | ✅    | ✅          | ✅   | ❌ (totaux seulement)| ⏳ À configurer |
| Instagram  | ✅    | ✅          | ✅   | ❌ (totaux seulement)| ⏳ À configurer |
| TikTok     | ✅    | ✅          | ✅   | ❌ (totaux seulement)| ⏳ À configurer |
| Snapchat   | ✅    | ✅          | ✅   | ❌ (totaux seulement)| ⏳ À configurer |

---

## Tâches — Sécurité

- [x] Exposition `package.json` via Vite dev server → `fs.deny` configuré
- [x] Source maps en production → `sourcemap: false` + Terser minification
- [x] Tokens OAuth dans query params (logs serveur) → Hash fragment `#at=...&rt=...`
- [x] Payment callback trust `?status=successful` → Vérification via `getProfile()` DB
- [x] Tokens reset/vérification en clair en DB → SHA-256 avant stockage
- [x] Règles de validation exposées (Zod) → `exposeFields: false` public / `true` privé
- [x] Webhooks Flutterwave/CinetPay bloqués par `router.use(authenticate)` → Routes publiques séparées
- [x] Messages d'erreur auth révèlent infos Passport → Message générique unique
- [x] Admin accessible via `plan === 'ENTERPRISE'` → Seul `isAdmin` flag DB
- [x] Panneau admin retiré du frontend → À reconstruire comme site séparé
- [x] 404 révèle le chemin de route → Message générique `"Ressource introuvable"`
- [x] `ENCRYPTION_KEY` trop courte (63 chars) → Clé 64 chars hexadécimale correcte
- [x] Token YouTube expiré → Refresh automatique via `getValidYouTubeToken()`

---

## Tâches — Fonctionnalités

- [x] Authentification (email + Google OAuth + MFA TOTP)
- [x] Vérification email + réinitialisation mot de passe (tokens hashés SHA-256)
- [x] Dashboard global (KPI, tendances, répartition plateformes)
- [x] Analytics par plateforme (posts, métriques, graphiques)
- [x] Comparaison multi-plateformes (radar + barres)
- [x] Heatmap engagement (7 jours × 24 heures)
- [x] Recommandations IA (meilleurs horaires, alertes, fréquence)
- [x] Génération rapports PDF/Excel
- [x] Paiement Flutterwave + CinetPay (Mobile Money + cartes)
- [x] Plans tarifaires (Free / Starter 5000 FCFA / Pro 15000 FCFA / Enterprise)
- [x] Paramètres (profil, MFA, connexions OAuth, zone danger)
- [x] YouTube OAuth + Analytics API quotidiens (views, likes, comments, shares, watchTime/jour)
- [x] Pinterest OAuth + API v5 (épingles, tableaux, analytics)
- [x] Dark mode complet (Tailwind `class` strategy)
- [x] WCAG 2.1 AA (skip-to-content, aria-labels, roles, htmlFor/id, contrastes)
- [x] Export graphiques PNG
- [x] Déploiement frontend Vercel (pour URL publique Pinterest/OAuth)
- [ ] Page `/privacy` pour Pinterest Developer
- [ ] Site admin séparé (dashboard administration)
- [ ] Notifications temps réel (alertes engagement, tokens expirés)
- [ ] Onboarding flow (accueil nouveaux utilisateurs)
- [ ] Analytics quotidiens Facebook / Instagram / TikTok / Snapchat
- [ ] Token refresh automatique pour Facebook / Instagram / TikTok / Snapchat

---

## Tâches — Infrastructure & Déploiement

- [x] Schéma PostgreSQL complet + migrations
- [x] Migration `FollowerSnapshot` (suivi croissance abonnés)
- [x] Migration `add_pinterest_platform` (enum Platform)
- [x] Cron jobs (sync auto 6h, nettoyage tokens 2h, rapports lundi 8h)
- [x] Logs Winston (console + error.log + combined.log)
- [x] Rate limiting (global + auth routes)
- [x] Helmet.js (headers sécurité HTTP)
- [x] Cache Redis (optionnel, fallback si non disponible)
- [x] Frontend Vercel déployé
- [ ] Backend VPS production (Ubuntu 22.04 + Nginx + PM2 + Let's Encrypt)
- [ ] Variables d'environnement production configurées
- [ ] Monitoring (Sentry frontend + backend)
- [ ] CI/CD pipeline GitHub Actions

---

## Variables d'environnement manquantes

```env
# À ajouter dans backend/.env pour activer les plateformes restantes
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

SNAPCHAT_CLIENT_ID=
SNAPCHAT_CLIENT_SECRET=

CINETPAY_API_KEY=
CINETPAY_SITE_ID=

FLUTTERWAVE_WEBHOOK_SECRET=

SENTRY_DSN=
VITE_SENTRY_DSN=
```
