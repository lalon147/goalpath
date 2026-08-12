const Joi = require('joi');

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must contain at least one uppercase letter, one lowercase letter, and one number');

// Mirrors USERNAME_PATTERN on the User model. Kept as its own rule so the API
// rejects a bad username with a readable message before Mongoose ever sees it.
const usernameRules = Joi.string()
  .trim()
  .lowercase()
  .min(3)
  .max(20)
  .pattern(/^[a-z0-9_]+$/)
  .message('Username can only use letters, numbers and underscore');

// Signup collects no PII by design: a username and a password, nothing else.
exports.signupSchema = Joi.object({
  username: usernameRules.required(),
  password: passwordRules.required()
});

exports.signinSchema = Joi.object({
  username: usernameRules.required(),
  password: Joi.string().required()
});

exports.recoverSchema = Joi.object({
  username: usernameRules.required(),
  // Dashes, spacing and case are normalised before comparison, so the shape is
  // left loose here rather than demanding the exact GP-XXXX-XXXX-XXXX form.
  recoveryCode: Joi.string().trim().min(8).max(40).required(),
  newPassword: passwordRules.required()
});

exports.regenerateRecoveryCodeSchema = Joi.object({
  password: Joi.string().required()
});

exports.refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.resetPasswordSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  newPassword: passwordRules.required()
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordRules.required()
});

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50),
  lastName: Joi.string().trim().min(1).max(50),
  bio: Joi.string().max(500).allow(''),
  timezone: Joi.string(),
  preferences: Joi.object({
    notificationsEnabled: Joi.boolean(),
    emailNotifications: Joi.boolean(),
    pushNotificationsEnabled: Joi.boolean(),
    dailyReminderTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
    language: Joi.string().length(2)
  })
});

exports.validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (!error) return next();

  const details = {};
  error.details.forEach(d => {
    const key = d.path.join('.');
    details[key] = d.message;
  });

  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
  });
};
