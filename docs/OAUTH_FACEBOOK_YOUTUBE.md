# Guide OAuth — Facebook & YouTube

## Facebook / Meta

### 1. Créer une application Meta Developer

1. Rendez-vous sur [developers.facebook.com](https://developers.facebook.com)
2. Cliquez **Mes applications** → **Créer une application**
3. Sélectionnez le type : **Business** (pour l'API Pages et Instagram)
4. Remplissez nom : `DATAhub`, email de contact

### 2. Configurer les produits

Dans votre app, ajoutez :
- **Facebook Login** → Web → URL : `https://votre-domaine.com`
- **Pages API** (pour les statistiques de pages)

### 3. OAuth Redirect URI

Dans **Facebook Login > Paramètres** :
```
URI de redirection OAuth valides:
https://votre-domaine.com/api/auth/facebook/callback
http://localhost:5000/api/auth/facebook/callback  (dev)
```

### 4. Permissions (Scopes) requises

| Permission | Usage |
|---|---|
| `pages_read_engagement` | Statistiques d'engagement des pages |
| `pages_show_list` | Liste des pages gérées |
| `read_insights` | Insights et analytics |
| `pages_read_user_content` | Publications |
| `instagram_basic` | Compte Instagram lié |
| `instagram_manage_insights` | Analytics Instagram |

### 5. Variables d'environnement

```env
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
```

### 6. Mode Live

Pour passer en production :
- Compléter la **vérification de l'entreprise** Meta
- Soumettre chaque permission pour **révision Meta**
- Délai moyen : 5-10 jours ouvrables

### 7. Token refresh

Les tokens Facebook expirent après **60 jours**. DATAhub les renouvelle automatiquement via l'endpoint `/api/auth/facebook/refresh`.

---

## YouTube (Google OAuth)

### 1. Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un projet : `DATAhub`
3. Activez les APIs :
   - **YouTube Data API v3**
   - **YouTube Analytics API**
   - **YouTube Reporting API**

### 2. Identifiants OAuth 2.0

1. **APIs & Services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth 2.0**
2. Type : **Application Web**
3. Origines JavaScript autorisées :
   ```
   http://localhost:3000
   https://votre-domaine.com
   ```
4. URI de redirection autorisées :
   ```
   http://localhost:5000/api/auth/google/callback
   https://votre-domaine.com/api/auth/google/callback
   ```

### 3. Scopes OAuth

```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/yt-analytics.readonly
https://www.googleapis.com/auth/yt-analytics-monetary.readonly
openid
profile
email
```

### 4. Variables d'environnement

```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv
YOUTUBE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv
```

### 5. Quota YouTube Data API

- Quota gratuit : **10 000 unités/jour**
- Coût par requête `analytics.query` : 1-10 unités
- Pour augmenter : Google Cloud Console → Quotas → Demander augmentation

### 6. Passage en production

- Vérifier le domaine dans Google Search Console
- Publier l'application OAuth (Écran de consentement → Publier)
- Pour les scopes sensibles : soumettre pour vérification Google (~4-6 semaines)

---

## Test en développement

```bash
# Démarrer le backend
cd backend && npm run dev

# Tester le flux OAuth Facebook
curl http://localhost:5000/api/auth/facebook

# Tester Google OAuth
curl http://localhost:5000/api/auth/google
```
