# Guide Flutterwave — Paiement Mobile Money & Cartes

## Présentation

Flutterwave est le fournisseur de paiement principal de DATAhub, supportant :

| Méthode | Pays | Devise |
|---|---|---|
| MTN Mobile Money | Bénin, CI, Sénégal, Ghana, RDC... | XOF, XAF, GHS, UGX |
| Wave | Sénégal, CI | XOF |
| Moov Money | Bénin, CI, Togo, Mali | XOF |
| Orange Money | Sénégal, CI, Mali, Burkina | XOF |
| Carte Visa/Mastercard | Mondial | USD, EUR, XOF... |
| Virement USSD | Nigeria | NGN |

---

## 1. Créer un compte Flutterwave Business

1. Allez sur [dashboard.flutterwave.com](https://dashboard.flutterwave.com)
2. Cliquez **Sign Up** → **Business Account**
3. Remplissez :
   - Nom de l'entreprise : `DATAhub`
   - Type : `Software / SaaS`
   - Pays d'enregistrement : Bénin (ou votre pays)
4. Vérification d'identité :
   - Pièce d'identité du représentant légal
   - Document d'enregistrement de l'entreprise (RCCM ou équivalent)

---

## 2. Obtenir vos clés API

Dans le dashboard Flutterwave :

1. **Settings** → **API Keys**
2. Copiez :
   - `Public Key` : commence par `FLWPUBK_TEST-...` (test) ou `FLWPUBK-...` (live)
   - `Secret Key` : commence par `FLWSECK_TEST-...` (test) ou `FLWSECK-...` (live)
   - `Encryption Key` : pour sécuriser les transactions

```env
# Dans backend/.env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-abcdef1234567890-X
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-abcdef1234567890-X
FLUTTERWAVE_WEBHOOK_SECRET=votre-webhook-secret-ici
```

---

## 3. Configurer le Webhook

Le webhook reçoit les confirmations de paiement en temps réel.

### Dans le dashboard Flutterwave :
1. **Settings** → **Webhooks**
2. URL du webhook :
   ```
   https://votre-domaine.com/api/payment/webhook
   ```
3. Cochez : **Payment events**, **Subscription events**
4. Copiez le **Secret Hash** → mettez-le dans `FLUTTERWAVE_WEBHOOK_SECRET`

### Sécurité du webhook (déjà implémenté) :
```javascript
// backend/src/routes/payment.js
const hash = req.headers['verif-hash'];
if (hash !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
  return res.status(401).json({ error: 'Invalid webhook signature' });
}
```

---

## 4. Plans DATAhub et tarification

```javascript
// Plans dans backend/src/routes/payment.js
const PLANS = {
  STARTER: { amount: 4999, currency: 'XOF', name: 'Plan Starter' },
  PRO:     { amount: 14999, currency: 'XOF', name: 'Plan Pro' },
  ENTERPRISE: { amount: 49999, currency: 'XOF', name: 'Plan Enterprise' },
};
```

---

## 5. Tester les paiements (Mode Test)

### Cartes de test Flutterwave :

```
Visa succès:    4187427415564246  |  CVV: 828  |  Exp: 09/32
Mastercard:     5531886652142950  |  CVV: 564  |  Exp: 09/32
Visa 3DS:       4242424242424242  |  CVV: 123  |  Exp: 12/30
Visa déclinée:  4111111111111111  |  CVV: 123  |  Exp: 12/30
```

### Mobile Money de test :

```
MTN Bénin:   Numéro: +22967000001  |  OTP: 123456
Wave:        Numéro: +221771234567 |  OTP: 1234
Orange Money: Numéro: +22500000000 |  PIN: 1234
```

### Test via API :
```bash
curl -X POST http://localhost:5000/api/payment/initialize \
  -H "Authorization: Bearer VOTRE_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "STARTER",
    "paymentMethod": "mobilemoney",
    "phone": "+22967000001",
    "network": "MTN"
  }'
```

---

## 6. Passer en mode Live (Production)

1. Compléter la vérification KYB (Know Your Business) sur Flutterwave
2. Soumettre les documents demandés (délai : 3-5 jours)
3. Remplacer les clés TEST par les clés LIVE dans `.env`
4. Mettre à jour l'URL du webhook en production

---

## 7. Réconciliation et rapports

Le dashboard Flutterwave fournit :
- Historique de toutes les transactions
- Exports CSV/Excel
- Rapports de règlement (settlement)
- Taux de conversion par méthode de paiement

Règlements : Flutterwave verse les fonds selon la fréquence convenue (quotidien, hebdomadaire) après déduction des frais (1.4% - 3.8% selon la méthode).

---

## 8. Support

- Documentation : [developer.flutterwave.com](https://developer.flutterwave.com)
- Support technique : support@flutterwave.com
- Slack communauté : developer.flutterwave.com/community
