const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLANS = {
  STARTER: { monthlyAmount: 5000, currency: 'XOF', name: 'Plan Starter' },
  PRO: { monthlyAmount: 15000, currency: 'XOF', name: 'Plan Pro' },
  ENTERPRISE: { monthlyAmount: null, currency: 'XOF', name: 'Plan Enterprise' },
};

const ANNUAL_DISCOUNT = 0.20;

router.use(authenticate);

router.post('/initialize', validate(schemas.initPayment), async (req, res, next) => {
  try {
    const { plan, billingCycle = 'monthly', paymentMethod = 'card' } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Plan invalide' });
    }

    const planConfig = PLANS[plan];
    if (!planConfig.monthlyAmount) {
      return res.status(400).json({ success: false, message: 'Contactez-nous pour le plan Enterprise' });
    }

    const isAnnual = billingCycle === 'annual';
    const amount = isAnnual
      ? Math.round(planConfig.monthlyAmount * 12 * (1 - ANNUAL_DISCOUNT))
      : planConfig.monthlyAmount;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, fullName: true },
    });

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: `datahub-${req.user.id}-${Date.now()}`,
        amount,
        currency: planConfig.currency,
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: { email: user.email, name: user.fullName },
        customizations: {
          title: 'DATAhub',
          description: `${planConfig.name}${isAnnual ? ' (Annuel)' : ' (Mensuel)'}`,
          logo: `${process.env.APP_URL || process.env.FRONTEND_URL}/logo.png`,
        },
        payment_options: paymentMethod === 'mobilemoney'
          ? 'mobilemoneyfranc,mobilemoneyrwanda,ussd'
          : 'card',
        meta: { userId: req.user.id, plan, billingCycle },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ success: true, data: { paymentLink: response.data.data?.link } });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];

    if (signature !== secretHash) {
      return res.status(401).send('Signature invalide');
    }

    const payload = JSON.parse(req.body);
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { userId, plan, billingCycle = 'monthly' } = payload.data.meta;
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === 'annual') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { plan } }),
        prisma.subscription.create({
          data: {
            userId,
            plan,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            paymentProvider: 'flutterwave',
            externalSubId: payload.data.id?.toString(),
            amount: payload.data.amount,
            currency: payload.data.currency,
          },
        }),
      ]);
    }

    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
});

// CinetPay — marché francophone (Côte d'Ivoire, Sénégal, Cameroun, Bénin, etc.)
router.post('/initialize-cinetpay', validate(schemas.initPayment), async (req, res, next) => {
  try {
    const { plan, billingCycle = 'monthly', phone } = req.body;

    if (!PLANS[plan]) return res.status(400).json({ success: false, message: 'Plan invalide' });
    const planConfig = PLANS[plan];
    if (!planConfig.monthlyAmount) return res.status(400).json({ success: false, message: 'Contactez-nous pour Enterprise' });

    const isAnnual = billingCycle === 'annual';
    const amount = isAnnual
      ? Math.round(planConfig.monthlyAmount * 12 * (1 - ANNUAL_DISCOUNT))
      : planConfig.monthlyAmount;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, fullName: true },
    });

    const transactionId = `DH-${req.user.id.slice(0, 8)}-${Date.now()}`;

    const response = await axios.post(
      'https://api-checkout.cinetpay.com/v2/payment',
      {
        apikey: process.env.CINETPAY_API_KEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: transactionId,
        amount,
        currency: 'XOF',
        description: `${planConfig.name}${isAnnual ? ' (Annuel)' : ' (Mensuel)'}`,
        return_url: `${process.env.FRONTEND_URL}/payment/callback`,
        notify_url: `${process.env.APP_URL || process.env.BACKEND_URL}/api/payment/webhook-cinetpay`,
        customer_name: user.fullName,
        customer_email: user.email,
        customer_phone_number: phone || '',
        channels: 'ALL',
        metadata: JSON.stringify({ userId: req.user.id, plan, billingCycle }),
        lang: 'fr',
      }
    );

    if (response.data.code !== '201') {
      return res.status(400).json({ success: false, message: response.data.message || 'Erreur CinetPay' });
    }

    res.json({ success: true, data: { paymentLink: response.data.data?.payment_url } });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook-cinetpay', express.json(), async (req, res, next) => {
  try {
    const { cpm_trans_id, cpm_site_id, cpm_trans_status, cpm_custom } = req.body;

    if (cpm_site_id !== process.env.CINETPAY_SITE_ID) {
      return res.status(401).send('Site ID invalide');
    }

    if (cpm_trans_status === 'ACCEPTED') {
      const meta = JSON.parse(cpm_custom || '{}');
      const { userId, plan, billingCycle = 'monthly' } = meta;

      if (userId && plan) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === 'annual') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await prisma.$transaction([
          prisma.user.update({ where: { id: userId }, data: { plan } }),
          prisma.subscription.create({
            data: {
              userId,
              plan,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentProvider: 'cinetpay',
              externalSubId: cpm_trans_id,
              amount: PLANS[plan]?.monthlyAmount || 0,
              currency: 'XOF',
            },
          }),
        ]);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'FREE', name: 'Free', price: 0, currency: 'XOF',
        features: ['1 plateforme', '30 jours historique', '2 rapports/mois', 'Dashboard basique'],
      },
      {
        id: 'STARTER', name: 'Starter', price: 5000, currency: 'XOF', recommended: false,
        features: ['3 plateformes', '90 jours historique', '10 rapports/mois', 'Recommandations basiques'],
      },
      {
        id: 'PRO', name: 'Pro', price: 15000, currency: 'XOF', recommended: true,
        features: ['5 plateformes', '12 mois historique', 'Rapports illimités', 'IA & recommandations avancées'],
      },
      {
        id: 'ENTERPRISE', name: 'Enterprise', price: null, currency: 'XOF',
        features: ['Plateformes illimitées', 'Historique personnalisé', 'API privée', 'Support dédié'],
      },
    ],
  });
});

module.exports = router;
