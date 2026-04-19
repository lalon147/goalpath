const Joi = require('joi');
const { validate } = require('./authValidator');

exports.createHabitSchema = Joi.object({
  goalId: Joi.string().hex().length(24),
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
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

exports.updateLogSchema = Joi.object({
  status: Joi.string().valid('completed', 'skipped', 'failed'),
  notes: Joi.string().max(500).allow(''),
  duration: Joi.number().integer().min(0),
  intensity: Joi.string().valid('low', 'medium', 'high')
});

exports.validate = validate;
