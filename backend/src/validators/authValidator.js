const Joi = require('joi');

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must contain at least one uppercase letter, one lowercase letter, and one number');

exports.signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordRules.required(),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required()
});

exports.signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
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
