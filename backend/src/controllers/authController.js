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

// GET /api/auth/username-available?username=
exports.usernameAvailable = asyncHandler(async (req, res) => {
  const username = User.normalizeUsername(req.query.username);

  if (!User.isValidUsername(username)) {
    return res.status(200).json({
      success: true,
      data: {
        username,
        available: false,
        reason: '3–20 characters, using letters, numbers or underscore'
      }
    });
  }

  const taken = await User.exists({ username });
  return res.status(200).json({
    success: true,
    data: {
      username,
      available: !taken,
      reason: taken ? 'That username is taken' : null,
      // Only computed when it would actually be shown; the lookup is wasted work
      // for the common case where the name is free.
      suggestion: taken ? await User.generateUniqueUsername(username) : null
    }
  });
});

exports.signup = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const normalized = User.normalizeUsername(username);

  const existing = await User.findOne({ username: normalized });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: 'That username is taken',
        details: { suggestion: await User.generateUniqueUsername(normalized) }
      }
    });
  }

  // Shown exactly once, in this response. Only the hash is kept, so it cannot
  // be recovered or re-sent later — losing it means losing the account.
  const recoveryCode = User.generateRecoveryCode();

  let user;
  try {
    user = await User.create({
      username: normalized,
      password,
      recoveryCodeHash: await User.hashRecoveryCode(recoveryCode)
    });
  } catch (err) {
    // Two signups racing on the same name both pass the check above; the unique
    // index is what actually settles it, so translate that into the same 409.
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USERNAME_EXISTS',
          message: 'That username is taken',
          details: { suggestion: await User.generateUniqueUsername(normalized) }
        }
      });
    }
    throw err;
  }

  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt
      },
      recoveryCode,
      tokens: { accessToken, refreshToken, expiresIn }
    }
  });
});

exports.signin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: User.normalizeUsername(username) })
    .select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' }
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
        username: user.username,
        displayName: user.displayName,
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
  // PII-free accounts have no email at all and recover via /auth/recover.
  if (user && user.email) {
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

// POST /api/auth/recover  { username, recoveryCode, newPassword }
//
// The way back in for accounts with no email. Deliberately kept separate from
// resetPassword: that flow proves ownership of an inbox, this one proves
// possession of a secret shown once at signup.
exports.recoverWithCode = asyncHandler(async (req, res) => {
  const { username, recoveryCode, newPassword } = req.body;

  const user = await User.findOne({ username: User.normalizeUsername(username) })
    .select('+recoveryCodeHash');

  // One message for "no such user", "no code set" and "wrong code" alike —
  // splitting them would confirm which usernames exist to anyone guessing.
  const invalid = () => res.status(400).json({
    success: false,
    error: { code: 'INVALID_RECOVERY', message: 'Username or recovery code is incorrect' }
  });

  if (!user || !user.recoveryCodeHash) return invalid();
  if (!(await user.compareRecoveryCode(recoveryCode))) return invalid();

  user.password = newPassword;
  // The old code is spent. Whoever recovers the account gets a fresh one, so a
  // code that leaked cannot be replayed against it later.
  const nextCode = User.generateRecoveryCode();
  user.recoveryCodeHash = await User.hashRecoveryCode(nextCode);
  user.resetTokens = [];
  user.refreshTokens = [];
  await user.save();

  return res.status(200).json({
    success: true,
    data: { recoveryCode: nextCode },
    message: 'Password reset. Save your new recovery code — it is shown only once.'
  });
});

// POST /api/auth/recovery-code (authed) — issue or replace this account's code.
// Existing accounts created before recovery codes have none until they call this.
exports.regenerateRecoveryCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password +recoveryCodeHash');

  if (!(await user.comparePassword(req.body.password))) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Password is incorrect' }
    });
  }

  const recoveryCode = User.generateRecoveryCode();
  user.recoveryCodeHash = await User.hashRecoveryCode(recoveryCode);
  await user.save();

  return res.status(200).json({
    success: true,
    data: { recoveryCode },
    message: 'Save this code. It is shown only once and replaces any previous one.'
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
