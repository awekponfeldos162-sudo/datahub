const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const metricsController = require('../controllers/metricsController');

router.use(authenticate);

router.get('/overview', metricsController.getDashboardOverview);
router.get('/platform/:platform', metricsController.getPlatformMetrics);
router.get('/top-posts', metricsController.getTopPosts);
router.get('/heatmap', metricsController.getEngagementHeatmap);
router.get('/compare', metricsController.getComparisonData);

module.exports = router;
