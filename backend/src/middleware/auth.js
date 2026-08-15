const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_ERROR', message: 'No token provided' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Algorithm pinned rather than inferred. jsonwebtoken@9 already refuses
    // `alg: none` and infers HMAC-only from a string key, so this is belt and
    // braces — but it makes the guarantee a property of this code rather than
    // of whichever library version happens to be installed.
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256']
    });
    const user = await User.findById(decoded.id).select('-password -refreshTokens -resetTokens');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'User not found' }
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Account is not active' }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_ERROR', message }
    });
  }
};

module.exports = auth;
