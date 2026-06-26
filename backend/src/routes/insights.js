const express = require('express');
const router = express.Router();
const { authenticate, requirePlan } = require('../middleware/auth');
const insightsController = require('../controllers/insightsController');

router.use(authenticate);

router.get('/', requirePlan('STARTER', 'PRO', 'ENTERPRISE'), insightsController.getInsights);

module.exports = router;
