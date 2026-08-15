require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();

// ============================================
// Configuration Checks
// ============================================

// Anything the app cannot serve a single authenticated request without. A
// missing JWT secret used to leave the process healthy on /api/health and
// throwing on the first sign-in, which reads as an application bug rather than
// a bad deploy — so it is checked here alongside the database URI.
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (missingEnv.length) {
  logger.error(
    `❌ Missing required environment variable(s): ${missingEnv.join(', ')}. ` +
    'Configure them in the environment before starting the server.'
  );
  process.exit(1);
}

// Warned rather than enforced on purpose. A short secret is weak, but refusing
// to boot over it would take a running deployment down on upgrade — which is a
// worse outcome than serving with a loud warning until it is rotated.
['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach(key => {
  if (process.env[key].length < 32) {
    logger.error(
      `⚠️  ${key} is only ${process.env[key].length} characters. Use at least 32 ` +
      '(e.g. `openssl rand -hex 32`) and redeploy — short secrets are brute-forceable.'
    );
  }
});

// Surface crashes that would otherwise kill the process without explanation.
process.on('unhandledRejection', err => {
  logger.error('❌ Unhandled promise rejection:', err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  logger.error('❌ Uncaught exception:', err && err.stack ? err.stack : err);
  process.exit(1);
});

// ============================================
// Middleware Setup
// ============================================

// Render terminates TLS and forwards to this process one hop away. Without
// this, req.ip is the proxy's address for every caller, so the rate limiters
// below bucket the whole world together and throttle nobody. Pinned to 1 hop
// rather than `true`: trusting the whole chain would let a client forge
// X-Forwarded-For and pick its own rate-limit key.
app.set('trust proxy', 1);

// Security headers: HSTS, nosniff, frameguard, and no x-powered-by.
app.use(helmet({
  // This API is consumed cross-origin by the web and mobile clients by design,
  // so the default same-origin resource policy would be the wrong default here.
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
//
// Fails closed. The wildcard fallback that used to live here combined with
// `credentials: true` meant a deploy that simply forgot CORS_ORIGIN silently
// began accepting credentialed requests from any origin, with nothing in the
// boot log to say so.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : null;

if (!corsOrigins) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      '❌ CORS_ORIGIN is not set in production. Refusing all browser origins ' +
      'until it is configured — set it to your web app URL and redeploy.'
    );
  } else {
    logger.info('ℹ️  CORS_ORIGIN not set; allowing any origin (development only).');
  }
}

app.use(cors({
  // An empty list in production rejects every browser origin. Native clients
  // send no Origin header at all and are unaffected either way.
  origin: corsOrigins || (process.env.NODE_ENV === 'production' ? [] : '*'),
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
  // Must be JSON in the same shape as every other error: the clients read
  // error.message, so a bare string surfaced as a generic "request failed".
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again in a minute.' }
  }
});
app.use(limiter);

// ============================================
// Database Connection
// ============================================

// MONGODB_URI presence is asserted in the configuration checks at the top.
mongoose.connect(process.env.MONGODB_URI)
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
    message: 'Welcome to LOCKED IN Backend API',
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
app.use('/api/suggestions', require('./routes/suggestionRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));

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

  // Errors raised deliberately by a controller carry a 4xx status and a message
  // written for the user, so those still pass through as-is.
  const status = err.status || 500;

  if (status < 500) {
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || 'REQUEST_ERROR',
        message: err.message || 'Request failed'
      }
    });
  }

  // Anything unhandled gets a fixed message. Driver and Mongoose errors name
  // collections, fields and sometimes connection details, and the client has no
  // use for any of it — the full error is already in the log line above.
  logger.error('Unhandled error:', err && err.stack ? err.stack : err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3000;

// Under test the app is driven in-process by supertest, which binds its own
// ephemeral port. Listening here as well would leave a handle open and make the
// suite hang after the last assertion.
const server = process.env.NODE_ENV === 'test'
  ? null
  : app.listen(PORT, () => {
    logger.info(`🚀 Backend running on http://localhost:${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  });

// Graceful Shutdown
const shutdown = (signal) => () => {
  logger.info(`${signal} signal received: closing HTTP server`);
  if (!server) return process.exit(0);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

module.exports = app;