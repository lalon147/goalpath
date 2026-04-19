const Joi = require('joi');
const { validate } = require('./authValidator');

exports.createGoalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('learning', 'health', 'career', 'personal', 'financial').required(),
  type: Joi.string().valid('short-term', 'long-term').required(),
  startDate: Joi.date().iso(),
  targetDate: Joi.date().iso().greater('now').required(),
  priority: Joi.string().valid('low', 'medium', 'high'),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  emoji: Joi.string().max(10)
});

exports.updateGoalSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().valid('learning', 'health', 'career', 'personal', 'financial'),
  type: Joi.string().valid('short-term', 'long-term'),
  targetDate: Joi.date().iso(),
  priority: Joi.string().valid('low', 'medium', 'high'),
  status: Joi.string().valid('active', 'completed', 'paused', 'abandoned'),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  emoji: Joi.string().max(10)
});

exports.createMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  targetDate: Joi.date().iso(),
  reward: Joi.string().max(500).allow('')
});

exports.updateMilestoneSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  targetDate: Joi.date().iso(),
  reward: Joi.string().max(500).allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed')
});

exports.validate = validate;
