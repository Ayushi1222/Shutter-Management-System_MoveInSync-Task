const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  fromStop: {
    type: mongoose.Schema.ObjectId,
    ref: 'Stop',
    required: true
  },
  toStop: {
    type: mongoose.Schema.ObjectId,
    ref: 'Stop',
    required: true
  },
  route: {
    type: mongoose.Schema.ObjectId,
    ref: 'Route',
    required: true
  },
  shuttle: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shuttle',
    required: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  scheduledDepartureTime: {
    type: Date,
    required: true
  },
  actualDepartureTime: {
    type: Date
  },
  scheduledArrivalTime: {
    type: Date
  },
  actualArrivalTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['booked', 'in-progress', 'completed', 'cancelled'],
    default: 'booked'
  },
  farePoints: {
    type: Number,
    required: true
  },
  transferTrips: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Trip'
  }],
  isTransfer: {
    type: Boolean,
    default: false
  },
  parentTrip: {
    type: mongoose.Schema.ObjectId,
    ref: 'Trip'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// middleware to populate references
TripSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  }).populate({
    path: 'fromStop toStop',
    select: 'name location'
  }).populate({
    path: 'route',
    select: 'name estimatedTime'
  }).populate({
    path: 'shuttle',
    select: 'vehicleNumber currentOccupancy capacity'
  });
  next();
});

module.exports = mongoose.model('Trip', TripSchema);