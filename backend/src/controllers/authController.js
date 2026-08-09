const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { sendPasswordReset } = require('../utils/mailer');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Only the hash is stored, so a leaked database dump cannot be used to reset
// anyone's password — the same reason the login password itself is hashed.
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
  return { accessToken, refreshToken, expiresIn: 3600 };
};

exports.signup = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
    });
  }

  const user = await User.create({ email, password, firstName, lastName });
  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      },
      tokens: { accessToken, refreshToken, expiresIn }
    }
  });
});

exports.signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
  }

  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' }
    });
  }

  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id);

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      tokens: { accessToken, refreshToken, expiresIn }
    }
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }
    });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Refresh token not recognised' }
    });
  }

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
  });

  return res.status(200).json({
    success: true,
    data: { accessToken, expiresIn: 3600 }
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always answer the same way. Varying the response by whether the address
  // exists would turn this endpoint into a way to enumerate registered users.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');

    // One live token per user: issuing a new link invalidates any earlier one.
    user.resetTokens = [{
      token: hashResetToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    }];
    await user.save();

    await sendPasswordReset(user.email, rawToken);
  }

  return res.status(200).json({
    success: true,
    message: 'If that email is registered, a reset link has been sent'
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const hashed = hashResetToken(token);

  const user = await User.findOne({
    'resetTokens.token': hashed,
    'resetTokens.expiresAt': { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' }
    });
  }

  user.password = newPassword;
  user.resetTokens = [];
  // A password reset is the remedy for a compromised account, so every existing
  // session has to die with it — otherwise an intruder keeps their refresh token.
  user.refreshTokens = [];
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password has been reset. Please sign in with your new password.'
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id);

  if (refreshToken && user) {
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});
