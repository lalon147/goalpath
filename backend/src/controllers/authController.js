const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

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
