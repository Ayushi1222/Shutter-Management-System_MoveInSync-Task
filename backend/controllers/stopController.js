const Stop = require('../models/Stop');
const Route = require('../models/Route');

// @desc    Get all stops
// @route   GET /api/stops
// @access  Private
const getAllStops = async (req, res) => {
  try {
    const stops = await Stop.find({}).sort('name');

    res.json({
      success: true,
      count: stops.length,
      stops,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get stop by ID
// @route   GET /api/stops/:id
// @access  Private
const getStopById = async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id);

    if (!stop) {
      return res.status(404).json({ success: false, message: 'Stop not found' });
    }

    const routes = await Route.find({
      stops: stop._id,
      isActive: true
    }).select('name description');

    res.json({
      success: true,
      stop,
      routes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get nearby stops based on location
// @route   GET /api/stops/nearby
// @access  Private
const getNearbyStops = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 500 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const stops = await Stop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).limit(5);

    res.json({
      success: true,
      count: stops.length,
      stops,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get stops by route
// @route   GET /api/stops/by-route/:routeId
// @access  Private
const getStopsByRoute = async (req, res) => {
  try {
    const routeId = req.params.routeId;
    
    const route = await Route.findById(routeId).populate('stops');
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({
      success: true,
      route: route.name,
      count: route.stops.length,
      stops: route.stops,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllStops,
  getStopById,
  getNearbyStops,
  getStopsByRoute,
};