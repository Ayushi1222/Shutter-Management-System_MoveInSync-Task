const express = require('express');
const router = express.Router();
const {
  getAllStops,
  getStopById,
  getNearbyStops,
  getStopsByRoute
} = require('../controllers/stopController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllStops);
router.get('/:id', protect, getStopById);
router.get('/nearby', protect, getNearbyStops);
router.get('/by-route/:routeId', protect, getStopsByRoute);

module.exports = router;