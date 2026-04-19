const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title too long']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description too long'],
    default: ''
  },
  order: { type: Number, default: 1 },
  targetDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  completedDate: { type: Date, default: null },
  reward: { type: String, maxlength: [500, 'Reward too long'], default: '' },
  completedAt: { type: Date, default: null }
}, {
  timestamps: true
});

milestoneSchema.index({ goalId: 1, order: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ targetDate: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
