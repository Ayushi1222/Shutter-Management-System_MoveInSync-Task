const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  getRoutesByStop,
  getOptimalRoutes
} = require('../controllers/routeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllRoutes);
router.get('/:id', protect, getRouteById);
router.get('/by-stop/:stopId', protect, getRoutesByStop);
router.post('/optimal', protect, getOptimalRoutes);

module.exports = router;