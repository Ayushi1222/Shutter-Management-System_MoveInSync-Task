const express = require('express');
const router = express.Router();
const {
  bookTrip,
  cancelTrip,
  getUserTrips,
  getTripById,
  getCurrentTrips
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

router.post('/book', protect, bookTrip);
router.post('/:id/cancel', protect, cancelTrip);
router.get('/user', protect, getUserTrips);
router.get('/current', protect, getCurrentTrips);
router.get('/:id', protect, getTripById);

module.exports = router;