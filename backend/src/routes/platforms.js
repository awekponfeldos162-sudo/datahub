const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const platformController = require('../controllers/platformController');

router.use(authenticate);

router.get('/', platformController.getConnectedPlatforms);
router.post('/connect', platformController.connectPlatform);
router.delete('/:platform', platformController.disconnectPlatform);
router.post('/:platform/sync', platformController.syncPlatform);

module.exports = router;
