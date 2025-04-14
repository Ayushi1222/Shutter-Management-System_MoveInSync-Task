const Route = require('../models/Route');
const Stop = require('../models/Stop');
const { findOptimalRoutes } = require('../utils/routeOptimizer');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Private
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true })
      .populate('stops', 'name location')
      .sort('name');

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

// @desc    Get route by ID
// @route   GET /api/routes/:id
// @access  Private
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('stops', 'name location description');

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get routes by stop
// @route   GET /api/routes/by-stop/:stopId
// @access  Private
const getRoutesByStop = async (req, res) => {
  try {
    const stopId = req.params.stopId;
    
    const routes = await Route.find({
      stops: stopId,
      isActive: true
    }).populate('stops', 'name location');

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

// @desc    Get optimal routes between stops
// @route   POST /api/routes/optimal
// @access  Private
const getOptimalRoutes = async (req, res) => {
  try {
    const { startStopId, endStopId, preferences } = req.body;

    if (!startStopId || !endStopId) {
      return res.status(400).json({
        success: false,
        message: 'Start and end stop IDs are required',
      });
    }

    const startStop = await Stop.findById(startStopId);
    const endStop = await Stop.findById(endStopId);

    if (!startStop || !endStop) {
      return res.status(404).json({
        success: false,
        message: 'One or both stops not found',
      });
    }

    const routes = await findOptimalRoutes(startStopId, endStopId, preferences);

    res.json({
      success: true,
      startStop: startStop.name,
      endStop: endStop.name,
      count: routes.length,
      routes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  getRoutesByStop,
  getOptimalRoutes,
};