const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a route name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  stops: [{
    stop: {
      type: mongoose.Schema.ObjectId,
      ref: 'Stop',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    arrivalTime: {
      type: String
    },
    departureTime: {
      type: String
    }
  }],
  distance: {
    type: Number,
    required: [true, 'Please add the total distance in kilometers']
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Please add the estimated travel time in minutes']
  },
  baseFare: {
    type: Number,
    required: [true, 'Please add the base fare in points']
  },
  peakHourMultiplier: {
    type: Number,
    default: 1.5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add middleware to populate stops when finding routes
RouteSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'stops.stop',
    select: 'name location'
  });
  next();
});

module.exports = mongoose.model('Route', RouteSchema);