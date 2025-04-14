# Shutter-Management-System_MoveInSync-Task

# Shuttle Management System

## Overview
The Shuttle Management System is a comprehensive solution designed to provide efficient, cost-effective, and seamless transportation for students across a university campus. The system allows real-time shuttle booking, route optimization, digital fare management, and trip history tracking, ensuring a hassle-free commuting experience.

## Features
- **Multi-Route Management**: Create and manage multiple routes with different stops across the campus
- **Student Profile Creation**: Email-based authentication for university students
- **Digital Fare Management**: Admin-assigned points for cashless transactions
- **Smart Shuttle Booking**: AI-powered suggestions for the best routes
- **Bus Transfer**: Allow students to change buses for optimal route selection
- **Trip History**: Detailed booking records and fare deduction history

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Route Optimization**: Custom algorithms

## Project Structure
```
shuttle-management-system/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── adminController.js  # Admin management logic
│   │   ├── authController.js   # Authentication logic
│   │   ├── routeController.js  # Route management logic
│   │   ├── shuttleController.js # Shuttle operations logic
│   │   ├── stopController.js   # Stop management logic
│   │   └── tripController.js   # Trip booking and history logic
│   ├── middleware/
│   │   ├── authMiddleware.js   # Authentication middleware
│   │   └── errorMiddleware.js  # Error handling middleware
│   ├── models/
│   │   ├── Admin.js            # Admin schema
│   │   ├── Route.js            # Route schema
│   │   ├── Shuttle.js          # Shuttle schema
│   │   ├── Stop.js             # Stop schema
│   │   ├── Trip.js             # Trip schema
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── adminRoutes.js      # Admin API endpoints
│   │   ├── authRoutes.js       # Authentication endpoints
│   │   ├── routeRoutes.js      # Route management endpoints
│   │   ├── shuttleRoutes.js    # Shuttle operation endpoints
│   │   ├── stopRoutes.js       # Stop management endpoints
│   │   └── tripRoutes.js       # Trip booking endpoints
│   ├── utils/
│   │   └── routeOptimizer.js   # Route optimization algorithms
│   ├── .env                    # Environment variables
│   ├── package.json            # Dependencies and scripts
│   └── server.js               # Entry point for the application
```

## Installation & Setup
1. Clone the repository
   ```
   git clone https://github.com/Ayushi1222/Shutter-Management-System_MoveInSync-Task.git
   cd shuttle-management-system/backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/shuttle-management
   JWT_SECRET=MyRoute
   JWT_EXPIRE=30d
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-email-password
   ```

4. Start the server
   ```
   npm start
   ```

## API Documentation

### Authentication
- **POST /api/auth/register** - Register a new user with university email
- **POST /api/auth/login** - Login and receive authentication token
- **GET /api/auth/me** - Get current user details

### Admin Operations
- **POST /api/admin/points** - Assign points to a student
- **GET /api/admin/users** - Get all registered users
- **PUT /api/admin/users/:id** - Update user details

### Routes Management
- **POST /api/routes** - Create a new route
- **GET /api/routes** - Get all routes
- **GET /api/routes/:id** - Get a specific route
- **PUT /api/routes/:id** - Update a route
- **DELETE /api/routes/:id** - Delete a route

### Stops Management
- **POST /api/stops** - Create a new stop
- **GET /api/stops** - Get all stops
- **GET /api/stops/:id** - Get a specific stop
- **PUT /api/stops/:id** - Update a stop
- **DELETE /api/stops/:id** - Delete a stop

### Shuttle Operations
- **POST /api/shuttles** - Add a new shuttle
- **GET /api/shuttles** - Get all shuttles
- **PUT /api/shuttles/:id** - Update shuttle details
- **GET /api/shuttles/route/:routeId** - Get shuttles for a specific route

### Trip Booking
- **POST /api/trips** - Book a new trip
- **GET /api/trips/history** - Get user's trip history
- **GET /api/trips/suggested-routes** - Get route suggestions between stops

## Implementation Details

### Authentication System
- University email-based registration
- JWT for secure API access
- Role-based access control (Admin/Student)

### Digital Wallet & Points System
- Points allocation by administrators
- Automatic point deduction for trips
- Tracking of point usage and balance

### Route Optimization
- Algorithms for calculating the best routes between stops
- Support for bus transfers to optimize travel time
- Peak hour and traffic pattern consideration

### Error Handling
- Comprehensive error handling middleware
- Meaningful error messages for debugging
- Fault tolerance for system failures

### System Monitoring
- Logging of system events and errors
- Performance tracking for API endpoints

## Future Enhancements
- Frontend implementation with React.js
- Mobile app development for better accessibility
- Real-time tracking of shuttles using GPS
- QR code-based ticketing system
- Integration with university calendar for class schedule optimization


 
