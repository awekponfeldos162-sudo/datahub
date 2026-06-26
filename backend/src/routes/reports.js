const express = require('express');
const router = express.Router();
const { authenticate, requirePlan } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

router.use(authenticate);

router.get('/', reportsController.getReportHistory);
router.post('/generate', requirePlan('STARTER', 'PRO', 'ENTERPRISE'), reportsController.generateReport);

module.exports = router;
