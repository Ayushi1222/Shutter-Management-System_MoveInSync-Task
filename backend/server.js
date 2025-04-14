// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const routeRoutes = require('./routes/routeRoutes');
const shuttleRoutes = require('./routes/shuttleRoutes');
const stopRoutes = require('./routes/stopRoutes');
const tripRoutes = require('./routes/tripRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/shuttles', shuttleRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/trips', tripRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Shuttle Management System API is running');
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});