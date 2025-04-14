const Shuttle = require('../models/Shuttle');
const Route = require('../models/Route');

// @desc    Get all shuttles
// @route   GET /api/shuttles
// @access  Private
const getAllShuttles = async (req, res) => {
  try {
    const shuttles = await Shuttle.find({})
      .populate('currentRoute', 'name')
      .populate('currentStop', 'name location')
      .sort('shuttleNumber');

    res.json({
      success: true,
      count: shuttles.length,
      shuttles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get active shuttles (currently on route)
// @route   GET /api/shuttles/active
// @access  Private
const getActiveShuttles = async (req, res) => {
  try {
    const shuttles = await Shuttle.find({ status: 'active' })
      .populate('currentRoute', 'name description stops')
      .populate('currentStop', 'name location')
      .populate('nextStop', 'name location');

    res.json({
      success: true,
      count: shuttles.length,
      shuttles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get shuttle by ID
// @route   GET /api/shuttles/:id
// @access  Private
const getShuttleById = async (req, res) => {
  try {
    const shuttle = await Shuttle.findById(req.params.id)
      .populate('currentRoute', 'name description stops')
      .populate('currentStop', 'name location')
      .populate('nextStop', 'name location');

    if (!shuttle) {
      return res.status(404).json({ success: false, message: 'Shuttle not found' });
    }

    res.json({
      success: true,
      shuttle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get shuttles by route
// @route   GET /api/shuttles/by-route/:routeId
// @access  Private
const getShuttlesByRoute = async (req, res) => {
  try {
    const routeId = req.params.routeId;
    
    // Verify route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    
    const shuttles = await Shuttle.find({ currentRoute: routeId })
      .populate('currentStop', 'name location')
      .populate('nextStop', 'name location');

    res.json({
      success: true,
      route: route.name,
      count: shuttles.length,
      shuttles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update shuttle location
// @route   PUT /api/shuttles/:id/location
// @access  Private/Admin
const updateShuttleLocation = async (req, res) => {
  try {
    const { 
      currentLocation, 
      currentStop, 
      nextStop, 
      status, 
      estimatedTimeToNextStop 
    } = req.body;

    const shuttle = await Shuttle.findById(req.params.id);
    
    if (!shuttle) {
      return res.status(404).json({ success: false, message: 'Shuttle not found' });
    }

    if (currentLocation) {
      shuttle.currentLocation = currentLocation;
    }
    
    if (currentStop) {
      shuttle.currentStop = currentStop;
    }
    
    if (nextStop) {
      shuttle.nextStop = nextStop;
    }
    
    if (status) {
      shuttle.status = status;
    }
    
    if (estimatedTimeToNextStop) {
      shuttle.estimatedTimeToNextStop = estimatedTimeToNextStop;
    }
    
    shuttle.lastUpdated = Date.now();

    const updatedShuttle = await shuttle.save();

    res.json({
      success: true,
      shuttle: updatedShuttle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllShuttles,
  getActiveShuttles,
  getShuttleById,
  getShuttlesByRoute,
  updateShuttleLocation,
};