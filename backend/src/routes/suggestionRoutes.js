const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const auth = require('../middleware/auth');
const { validate } = require('../validators/authValidator');

const suggestSchema = Joi.object({
  kind: Joi.string().valid('milestones', 'habits', 'daily-practice').required(),
  title: Joi.string().trim().min(3).max(200).required(),
  category: Joi.string().max(50).allow('', null),
  description: Joi.string().max(1000).allow('', null),
  // Only meaningful for 'daily-practice'; capped so one request cannot ask for
  // an unbounded plan.
  weeks: Joi.number().integer().min(4).max(12)
});

// Every request here costs money, so this is throttled well below the global
// limiter. Per-user rather than per-IP, so one noisy network can't lock out
// everyone behind it.
const suggestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many suggestion requests. Try again later.'
    }
  }
});

router.post('/', auth, suggestLimiter, validate(suggestSchema), suggestionController.suggest);

module.exports = router;
