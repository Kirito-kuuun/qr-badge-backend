const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes protégées (admin)
router.use(authMiddleware);
router.get('/', accessController.getAllAccesses);
router.get('/stats', accessController.getAccessStats);
router.get('/badge/:badgeId', accessController.getAccessesByBadge);
router.delete('/:id', accessController.deleteAccess);

module.exports = router;
