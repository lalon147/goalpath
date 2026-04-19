const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  category: {
    type: String,
    enum: ['learning', 'health', 'career', 'personal', 'financial'],
    required: [true, 'Category is required']
  },
  type: {
    type: String,
    enum: ['short-term', 'long-term'],
    required: [true, 'Type is required']
  },
  startDate: { type: Date, default: Date.now },
  targetDate: { type: Date, required: [true, 'Target date is required'] },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  totalMilestones: { type: Number, default: 0 },
  completedMilestones: { type: Number, default: 0 },
  color: { type: String, default: '#6C63FF' },
  emoji: { type: String, default: '🎯' },
  milestones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' }],
  habits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }]
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ userId: 1, targetDate: 1 });

goalSchema.methods.recalculateProgress = async function () {
  const Milestone = mongoose.model('Milestone');
  const total = await Milestone.countDocuments({ goalId: this._id });
  const completed = await Milestone.countDocuments({ goalId: this._id, status: 'completed' });
  this.totalMilestones = total;
  this.completedMilestones = completed;
  this.completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
};

module.exports = mongoose.model('Goal', goalSchema);
