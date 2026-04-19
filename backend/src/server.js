require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();

// ============================================
// Middleware Setup
// ============================================

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// ============================================
// Database Connection
// ============================================

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    logger.info('✅ MongoDB Atlas connected successfully');
  })
  .catch(err => {
    logger.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ============================================
// Health Check Route
// ============================================

app.get('/api/health', (req, res) => {
  const health = {
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json(health);
  }
  
  res.status(200).json(health);
});

// ============================================
// Root Route
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GoalPath Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      goals: '/api/goals',
      habits: '/api/habits',
      analytics: '/api/analytics'
    }
  });
});

// Pre-register models to avoid populate errors
require('./models/User');
require('./models/Goal');
require('./models/Milestone');
require('./models/Habit');
require('./models/HabitLog');

// ============================================
// Routes
// ============================================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ============================================
// 404 Handler
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// ============================================
// Error Handling Middleware
// ============================================

app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID'
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Backend running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;