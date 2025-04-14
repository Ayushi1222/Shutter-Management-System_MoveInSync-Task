const express = require('express');
const router = express.Router();
const { 
  registerAdmin, 
  loginAdmin, 
  getAdminProfile, 
  assignPointsToStudent,
  createRoute,
  updateRoute,
  deleteRoute,
  getAllRoutes,
  getSystemStats
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin auth routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);

// Admin management routes
router.post('/assign-points', protect, adminOnly, assignPointsToStudent);
router.post('/routes', protect, adminOnly, createRoute);
router.put('/routes/:id', protect, adminOnly, updateRoute);
router.delete('/routes/:id', protect, adminOnly, deleteRoute);
router.get('/routes', protect, adminOnly, getAllRoutes);
router.get('/stats', protect, adminOnly, getSystemStats);

module.exports = router;