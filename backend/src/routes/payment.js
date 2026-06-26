const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLANS = {
  STARTER: { amount: 5000, currency: 'XOF', name: 'Plan Starter' },
  PRO: { amount: 15000, currency: 'XOF', name: 'Plan Pro' },
  ENTERPRISE: { amount: null, currency: 'XOF', name: 'Plan Enterprise' },
};

router.use(authenticate);

router.post('/initialize', async (req, res, next) => {
  try {
    const { plan, paymentMethod = 'card' } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Plan invalide' });
    }

    const planConfig = PLANS[plan];
    if (!planConfig.amount) {
      return res.status(400).json({ success: false, message: 'Contactez-nous pour le plan Enterprise' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, fullName: true },
    });

    // Flutterwave payment initialization
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: `datahub-${req.user.id}-${Date.now()}`,
        amount: planConfig.amount,
        currency: planConfig.currency,
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        customer: { email: user.email, name: user.fullName },
        customizations: {
          title: 'DATAhub',
          description: planConfig.name,
          logo: `${process.env.APP_URL}/logo.png`,
        },
        payment_options: paymentMethod === 'mobile_money'
          ? 'mobilemoneyfranc,mobilemoneyrwanda,ussd'
          : 'card',
        meta: { userId: req.user.id, plan },
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
      const { userId, plan } = payload.data.meta;
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

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
