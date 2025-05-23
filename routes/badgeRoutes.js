const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes publiques
router.post('/validate', badgeController.validateQrCode);
router.get('/check/:qrCode', badgeController.checkQrCode);

// Routes protégées (admin)
router.use(authMiddleware);
router.get('/', badgeController.getAllBadges);
router.get('/:id', badgeController.getBadgeById);
router.post('/', badgeController.createBadge);
router.put('/:id', badgeController.updateBadge);
router.delete('/:id', badgeController.deleteBadge);
router.post('/close-event', badgeController.closeEvent);

module.exports = router;
