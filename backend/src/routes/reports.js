const express = require('express');
const router = express.Router();
const { authenticate, requirePlan } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const reportsController = require('../controllers/reportsController');

router.use(authenticate);

router.get('/', reportsController.getReportHistory);
router.post('/generate', requirePlan('STARTER', 'PRO', 'ENTERPRISE'), validate(schemas.generateReport), reportsController.generateReport);

module.exports = router;
