const mongoose = require('mongoose');

const ShuttleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please add a vehicle number'],
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please add the seating capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  currentRoute: {
    type: mongoose.Schema.ObjectId,
    ref: 'Route'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  currentStatus: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Geospatial index for location queries
ShuttleSchema.index({ currentLocation: '2dsphere' });

// middleware to populate currentRoute when finding shuttles
ShuttleSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'currentRoute',
    select: 'name stops'
  });
  next();
});

module.exports = mongoose.model('Shuttle', ShuttleSchema);