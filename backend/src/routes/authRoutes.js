const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const {
  validate,
  signupSchema,
  signinSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/authValidator');

// Tighter than the global limiter: requesting a reset sends mail and rewrites
// the stored token, so it is worth throttling harder than ordinary traffic.
const limit = (max) => rateLimit({
  windowMs: 60 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many reset attempts. Try again later.' }
  }
});

// Separate buckets on purpose. These ran off one shared counter at first, which
// meant a user who tripped the password rules a few times could no longer
// request a link — spending the send quota on their own typos.
const forgotLimiter = limit(5);
const resetLimiter = limit(10);

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
