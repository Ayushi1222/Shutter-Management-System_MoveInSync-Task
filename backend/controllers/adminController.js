const Admin = require('../models/Admin');
const User = require('../models/User');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    const admin = await Admin.create({
      name,
      email,
      password,
    });

    if (admin) {
      res.status(201).json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    
    if (admin) {
      res.json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Assign points to student
// @route   POST /api/admin/assign-points
// @access  Private/Admin
const assignPointsToStudent = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add points to user wallet
    user.walletBalance += Number(points);
    
    // Add transaction record
    user.transactions.push({
      amount: points,
      type: 'credit',
      reason: reason || 'Admin allocation',
      timestamp: Date.now(),
    });

    await user.save();

    res.json({
      success: true,
      message: `${points} points assigned to ${user.name}`,
      currentBalance: user.walletBalance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new route
// @route   POST /api/admin/routes
// @access  Private/Admin
const createRoute = async (req, res) => {
  try {
    const {
      name,
      description,
      stops,
      startTime,
      endTime,
      frequency,
      peakTimes,
      isActive,
    } = req.body;

    const route = await Route.create({
      name,
      description,
      stops,
      startTime,
      endTime,
      frequency,
      peakTimes: peakTimes || {
        morning: false,
        evening: false
      },
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      route,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update route
// @route   PUT /api/admin/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res) => {
  try {
    const {
      name,
      description,
      stops,
      startTime,
      endTime,
      frequency,
      peakTimes,
      isActive,
    } = req.body;

    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    if (name) route.name = name;
    if (description) route.description = description;
    if (stops) route.stops = stops;
    if (startTime) route.startTime = startTime;
    if (endTime) route.endTime = endTime;
    if (frequency) route.frequency = frequency;
    if (peakTimes) route.peakTimes = peakTimes;
    if (isActive !== undefined) route.isActive = isActive;
    
    route.updatedAt = Date.now();
    route.updatedBy = req.user._id;

    const updatedRoute = await route.save();

    res.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete route
// @route   DELETE /api/admin/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    await route.remove();

    res.json({
      success: true,
      message: 'Route removed',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all routes
// @route   GET /api/admin/routes
// @access  Private/Admin
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({})
      .populate('stops', 'name location')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    res.json({
      success: true,
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    const routeCount = await Route.countDocuments();
    
    const tripCount = await Trip.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTrips = await Trip.countDocuments({
      createdAt: { $gte: today }
    });
    
    const activeRoutes = await Route.countDocuments({
      isActive: true
    });
    
    const popularRoutes = await Trip.aggregate([
      {
        $group: {
          _id: '$route',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'routeDetails'
        }
      },
      {
        $unwind: '$routeDetails'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$routeDetails.name'
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        userCount,
        routeCount,
        tripCount,
        todayTrips,
        activeRoutes,
        popularRoutes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  assignPointsToStudent,
  createRoute,
  updateRoute,
  deleteRoute,
  getAllRoutes,
  getSystemStats
};