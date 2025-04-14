const express = require('express');
const router = express.Router();
const {
  getAllShuttles,
  getShuttleById,
  getShuttlesByRoute,
  updateShuttleLocation,
  getActiveShuttles
} = require('../controllers/shuttleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getAllShuttles);
router.get('/active', protect, getActiveShuttles);
router.get('/:id', protect, getShuttleById);
router.get('/by-route/:routeId', protect, getShuttlesByRoute);
router.put('/:id/location', protect, adminOnly, updateShuttleLocation);

module.exports = router;