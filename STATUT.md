# DATAhub — Statut du projet

Dernière mise à jour : 28 juin 2026

---

## État général

| Composant | Statut |
|-----------|--------|
| Backend API | ✅ Fonctionnel (localhost:5000) |
| Frontend React | ✅ Fonctionnel (localhost:3000) |
| Base de données PostgreSQL | ✅ Toutes migrations appliquées |
| YouTube OAuth + Analytics | ✅ Testé et fonctionnel |
| Pinterest OAuth | ✅ Intégré (attend credentials) |
| Paiement Flutterwave | ✅ Code complet (clé API à configurer) |
| Paiement CinetPay | ✅ Code complet (clé API à configurer) |
| Frontend Vercel | ✅ Déployé |
| Backend production | ❌ Non déployé |

---

## Ce qui fonctionne aujourd'hui (développement)

### Authentification
- Inscription email avec vérification
- Connexion email + Google OAuth
- MFA TOTP (QR code + speakeasy)
- Réinitialisation mot de passe (token SHA-256)
- JWT access 24h + refresh 7j avec rotation
- Token refresh automatique côté frontend (intercepteur Axios)

### YouTube (seule plateforme testée en production)
- OAuth 2.0 flow complet (DATAhub Google Cloud Project `datahub-500622`)
- Récupération infos chaîne (abonnés, nom, avatar)
- Sync vidéos + métriques quotidiennes via YouTube Analytics API
- Refresh automatique du token expiré avant chaque sync
- Affichage dans Dashboard, Analytics, Heatmap, Comparaison

### Dashboard & Analytics
- Vue d'ensemble (KPI totaux, tendances, répartition plateformes)
- Analytics par plateforme avec pagination
- Comparaison radar + barres multi-plateformes
- Heatmap engagement 7j × 24h
- Export graphiques PNG

### Paiement (code complet, pas testé en prod)
- Flutterwave : cartes + Mobile Money
- CinetPay : Mobile Money Afrique de l'Ouest
- Webhooks publics (sans auth middleware) avec vérification signature
- Plans : Free / Starter 5000 FCFA / Pro 15000 FCFA / Enterprise

---

## Credentials configurés

| Service | État |
|---------|------|
| Google OAuth (Login + YouTube) | ✅ `445169325074-...` |
| YouTube Data API v3 | ✅ Activée dans GCP |
| YouTube Analytics API | ✅ Activée dans GCP |
| PostgreSQL | ✅ `datahub_user / Planck55` |
| JWT Secret | ✅ Configuré |
| ENCRYPTION_KEY | ✅ 64 chars hex |
| Flutterwave | ⏳ Clé de test à configurer |
| CinetPay | ⏳ Clé à configurer |
| Pinterest | ⏳ App créée, secret à ajouter |
| Facebook | ⏳ Non configuré |
| Instagram | ⏳ Non configuré |
| TikTok | ⏳ Non configuré |
| Snapchat | ⏳ Non configuré |
| SMTP (emails) | ⏳ À configurer |
| Sentry (monitoring) | ⏳ À configurer |

---

## Google Cloud Console (Projet DATAhub)

- **Projet** : DATAhub (`datahub-500622`)
- **Client OAuth** : `Client Web 1` — ID `445169325074-n1tij89pb9ha18ljl4t085mkjfd9mpj9.apps.googleusercontent.com`
- **Redirect URIs autorisées** :
  - `http://localhost:5000/api/auth/google/callback`
  - `http://localhost:5000/api/auth/youtube/callback`
- **APIs activées** : YouTube Data API v3, YouTube Analytics API
- **Écran de consentement** : Externe / En test
- **Utilisateurs test** : `awekponfeldos162@gmail.com`

---

## Migrations DB appliquées

```
20260626120000_follower_snapshots   ✅ Appliquée
20260627021549_add_pinterest_platform ✅ Appliquée
```

---

## Prochaines étapes prioritaires

1. **Ajouter credentials Pinterest** dans `.env` (`PINTEREST_APP_ID` + `PINTEREST_APP_SECRET`)
2. **Créer page `/privacy`** pour validation app Pinterest Developer
3. **Configurer Flutterwave** (`FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_SECRET`)
4. **Configurer SMTP** pour les emails de vérification
5. **Facebook / Instagram** : créer apps Meta Developer et configurer
6. **TikTok** : créer app TikTok Developer et configurer
7. **Site admin séparé** : nouveau projet à créer
8. **Déploiement backend** : VPS Ubuntu + Nginx + PM2 + SSL

---

## Bugs connus

| Bug | Statut |
|-----|--------|
| YouTube Analytics retourne vide pour vidéos < 24h | ⚠️ Fallback implémenté |
| Redis non disponible en dev | ⚠️ Cache désactivé gracieusement |
| Prisma Client EPERM au redémarrage sous Windows | ⚠️ Cosmétique, pas bloquant |
