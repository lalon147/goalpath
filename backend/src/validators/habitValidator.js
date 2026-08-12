const Joi = require('joi');
const { validate } = require('./authValidator');

const habitCategories = ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social'];

exports.createHabitSchema = Joi.object({
  goalId: Joi.string().hex().length(24),
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  emoji: Joi.string().max(10),
  category: Joi.string().valid(...habitCategories).allow('', null),
  targetValue: Joi.number().integer().min(1),
  unit: Joi.string().max(30).allow(''),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)),
  startDate: Joi.date().iso(),
  reminders: Joi.array().items(Joi.object({
    time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    message: Joi.string().max(200).allow(''),
    enabled: Joi.boolean()
  }))
});

exports.updateHabitSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  emoji: Joi.string().max(10),
  category: Joi.string().valid(...habitCategories).allow('', null),
  targetValue: Joi.number().integer().min(1),
  unit: Joi.string().max(30).allow(''),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly'),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)),
  status: Joi.string().valid('active', 'paused', 'completed'),
  reminders: Joi.array().items(Joi.object({
    time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    message: Joi.string().max(200).allow(''),
    enabled: Joi.boolean()
  }))
});

exports.logHabitSchema = Joi.object({
  logDate: Joi.date().iso().required(),
  status: Joi.string().valid('completed', 'skipped', 'failed').required(),
  notes: Joi.string().max(500).allow(''),
  duration: Joi.number().integer().min(0),
  intensity: Joi.string().valid('low', 'medium', 'high')
});

// `status: null` is meaningful here — it clears the day rather than setting it,
// which is how the week grid undoes a mis-tap.
exports.setLogByDateSchema = Joi.object({
  date: Joi.date().iso().required(),
  status: Joi.string().valid('completed', 'skipped', 'failed').allow(null).required(),
  notes: Joi.string().max(500).allow(''),
  duration: Joi.number().integer().min(0)
});

exports.updateLogSchema = Joi.object({
  status: Joi.string().valid('completed', 'skipped', 'failed'),
  notes: Joi.string().max(500).allow(''),
  duration: Joi.number().integer().min(0),
  intensity: Joi.string().valid('low', 'medium', 'high')
});

exports.validate = validate;
