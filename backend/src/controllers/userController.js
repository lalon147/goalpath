const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user.toPublicJSON()
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'bio', 'timezone', 'preferences'];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.preferences) {
    updates.preferences = { ...req.user.preferences.toObject(), ...updates.preferences };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    data: user.toPublicJSON()
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' }
    });
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});
