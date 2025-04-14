const Trip = require('../models/Trip');
const User = require('../models/User');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const { findOptimalRoutes } = require('../utils/routeOptimizer');

// @desc    Book a trip
// @route   POST /api/trips/book
// @access  Private
const bookTrip = async (req, res) => {
  try {
    const { startStopId, endStopId, routeId, routeType, transferStopId } = req.body;

    if (!startStopId || !endStopId) {
      return res.status(400).json({
        success: false,
        message: 'Start and end stops are required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let route = null;
    if (routeId) {
      route = await Route.findById(routeId);
      if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
      }
    } else {
      const optimalRoutes = await findOptimalRoutes(startStopId, endStopId, {
        prioritizeFast: true
      });
      
      if (optimalRoutes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No available routes between these stops',
        });
      }
      
      route = optimalRoutes[0].route;
    }

    const startStop = await Stop.findById(startStopId);
    const endStop = await Stop.findById(endStopId);
    
    if (!startStop || !endStop) {
      return res.status(404).json({
        success: false,
        message: 'One or both stops not found',
      });
    }

    // Basic fare calculation
    const baseFare = 2; // Base fare in points
    const perStopFare = 0.5; // Additional points per stop

    const routeStops = route.stops.map(stop => stop.toString());
    const startIndex = routeStops.indexOf(startStopId);
    const endIndex = routeStops.indexOf(endStopId);
    
    // Handle stops not on the route
    if (startIndex === -1 || endIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'The selected stops are not on this route',
      });
    }
    
    const stopCount = Math.abs(endIndex - startIndex);
    const fare = baseFare + (stopCount * perStopFare);
    
    // If this is a transfer route with special pricing
    let transferRoute = null;
    let transferStop = null;
    if (routeType === 'transfer' && transferStopId) {
      transferStop = await Stop.findById(transferStopId);
      
      if (!transferStop) {
        return res.status(404).json({
          success: false,
          message: 'Transfer stop not found',
        });
      }
      
      // Apply transfer discount
      fare = fare * 0.8;
    }

    if (user.walletBalance < fare) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: fare,
        balance: user.walletBalance,
      });
    }

    const trip = await Trip.create({
      user: req.user._id,
      startStop: startStopId,
      endStop: endStopId,
      route: routeId || route._id,
      fare,
      status: 'booked',
      routeType: routeType || 'direct',
      transferStop: transferStopId || null,
    });
    user.walletBalance -= fare;
  
    user.transactions.push({
      amount: -fare,
      type: 'debit',
      reason: `Fare for trip from ${startStop.name} to ${endStop.name}`,
      tripId: trip._id,
      timestamp: Date.now(),
    });
    
    await user.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('startStop', 'name location')
      .populate('endStop', 'name location')
      .populate('route', 'name')
      .populate('transferStop', 'name location');

    res.status(201).json({
      success: true,
      trip: populatedTrip,
      fare,
      remainingBalance: user.walletBalance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel a trip
// @route   POST /api/trips/:id/cancel
// @access  Private
const cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this trip',
      });
    }
    
    // Check if trip can be cancelled (not yet started or completed)
    if (trip.status === 'completed' || trip.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Trip cannot be cancelled as it is already ${trip.status}`,
      });
    }
    
    // If already cancelled
    if (trip.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Trip is already cancelled',
      });
    }
    
    // Calculate refund amount based on cancellation policy
    // Example: Full refund if cancelled more than 15 minutes before trip
    const now = new Date();
    const tripTime = new Date(trip.createdAt);
    const minutesDifference = Math.floor((tripTime - now) / (1000 * 60));
    
    let refundAmount = 0;
    if (minutesDifference >= 15) {
      // Full refund
      refundAmount = trip.fare;
    } else if (minutesDifference >= 5) {
      // 50% refund if cancelled 5-15 minutes before
      refundAmount = trip.fare * 0.5;
    }
    // No refund if cancelled less than 5 minutes before
    
    trip.status = 'cancelled';
    trip.cancellationReason = req.body.reason || 'User cancelled';
    trip.updatedAt = Date.now();
    await trip.save();
    
    // Process refund if applicable
    if (refundAmount > 0) {
      const user = await User.findById(req.user._id);
      
      user.walletBalance += refundAmount;
      
      user.transactions.push({
        amount: refundAmount,
        type: 'credit',
        reason: `Refund for cancelled trip #${trip._id}`,
        tripId: trip._id,
        timestamp: Date.now(),
      });
      
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Trip cancelled successfully',
      refundAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's trips
// @route   GET /api/trips/user
// @access  Private
const getUserTrips = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const trips = await Trip.find(query)
      .populate('startStop', 'name location')
      .populate('endStop', 'name location')
      .populate('route', 'name')
      .populate('transferStop', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Trip.countDocuments(query);
    
    res.json({
      success: true,
      count: trips.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      trips,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('startStop', 'name location')
      .populate('endStop', 'name location')
      .populate('route', 'name description')
      .populate('transferStop', 'name location')
      .populate('user', 'name email');
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    if (trip.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this trip',
      });
    }
    
    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get current trips (in-progress)
// @route   GET /api/trips/current
// @access  Private
const getCurrentTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ 
      user: req.user._id,
      status: 'in-progress'
    })
    .populate('startStop', 'name location')
    .populate('endStop', 'name location')
    .populate('route', 'name')
    .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  bookTrip,
  cancelTrip,
  getUserTrips,
  getTripById,
  getCurrentTrips,
};