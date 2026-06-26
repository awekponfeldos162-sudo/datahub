# Guide OAuth — TikTok & Snapchat

## TikTok

### 1. TikTok for Developers

1. Allez sur [developers.tiktok.com](https://developers.tiktok.com)
2. Connectez-vous avec un compte TikTok Business
3. Créez une application : **Créer une application** → Web

### 2. Configuration

- **Nom** : DATAhub
- **Catégorie** : Analytics / Data
- **Website URL** : https://votre-domaine.com
- **Redirect URI** :
  ```
  https://votre-domaine.com/api/auth/tiktok/callback
  http://localhost:5000/api/auth/tiktok/callback
  ```

### 3. Scopes TikTok requis

| Scope | Usage |
|---|---|
| `user.info.basic` | Infos de base du compte |
| `video.list` | Liste des vidéos |
| `video.insights` | Analytics par vidéo |
| `research.adlib.basic` | Données publicitaires |

> **Note** : `video.insights` est un scope avancé nécessitant approbation TikTok.

### 4. Variables d'environnement

```env
TIKTOK_CLIENT_KEY=aw123456789abcdef
TIKTOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
```

### 5. Flux OAuth TikTok

TikTok utilise une implémentation OAuth légèrement différente :

```
GET https://www.tiktok.com/v2/auth/authorize/
  ?client_key=CLIENT_KEY
  &scope=user.info.basic,video.list
  &response_type=code
  &redirect_uri=REDIRECT_URI
  &state=STATE
```

Exchange du code :
```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=...&client_secret=...&code=...&grant_type=authorization_code&redirect_uri=...
```

### 6. Rate Limits TikTok

- 1 000 requêtes / 24h par token
- 10 requêtes / seconde par IP

### 7. Approbation

Le processus de révision TikTok peut prendre **2-4 semaines**. Préparez :
- Description détaillée de l'usage des données
- Politique de confidentialité
- Démonstration vidéo de l'application

---

## Snapchat

### 1. Snap Kit et Marketing API

Deux APIs distinctes :
- **Snap Kit** : Pour la connexion utilisateur (Login Kit)
- **Snapchat Marketing API** : Pour les analytics publicitaires

### 2. Snap Developer Console

1. Allez sur [kit.snapchat.com](https://kit.snapchat.com) ou [developers.snap.com](https://developers.snap.com)
2. Créez une organisation et un projet
3. Activez **Login Kit** et **Marketing API**

### 3. Configuration OAuth

- **Bundle ID** (iOS) / **Package Name** (Android)
- **Redirect URL** :
  ```
  https://votre-domaine.com/api/auth/snapchat/callback
  http://localhost:5000/api/auth/snapchat/callback
  ```

### 4. Scopes Snapchat

```
https://auth.snapchat.com/oauth2/api/user.display_name
https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar
snapchat-marketing-api
```

### 5. Variables d'environnement

```env
SNAPCHAT_CLIENT_ID=abcdef12-3456-7890-abcd-ef1234567890
SNAPCHAT_CLIENT_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz123456789
```

### 6. Marketing API — Endpoints clés

```
GET  /v1/me                           — Infos compte
GET  /v1/me/adaccounts                — Comptes publicitaires
GET  /v1/adaccounts/{id}/campaigns    — Campagnes
GET  /v1/adaccounts/{id}/stats        — Statistiques

Auth: Bearer {access_token}
Base URL: https://adsapi.snapchat.com
```

### 7. Token Refresh

Snapchat tokens expirent après **30 minutes** (access) et **1 heure** (refresh).
DATAhub gère le renouvellement automatique via `snapchatService.refreshAccessToken()`.

### 8. Sandbox / Test Mode

Utilisez le mode **Sandbox** pour tester sans compte publicitaire réel :
- Données simulées disponibles
- Aucune approbation requise
- Activé via `&mode=sandbox` sur l'URL d'autorisation

---

## Intégration dans DATAhub

Une fois vos credentials obtenus, ajoutez-les dans `backend/.env` et redémarrez :

```bash
cd backend && npm run dev
```

Les plateformes apparaîtront alors dans **Paramètres → Réseaux sociaux connectés**.
