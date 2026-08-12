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
  completedAt: { type: Date, default: null },

  // Per-member completion, used when the goal's progressMode is 'separate'.
  // `status`/`completedDate` above stay the goal owner's own state so every
  // existing query and screen keeps working untouched.
  completions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: Date.now }
  }],

  // In 'shared' mode the milestone has one state for the whole group, held in
  // `status` above. This only records whose tick it was, so the group can see
  // who did what.
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

milestoneSchema.index({ goalId: 1, order: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ targetDate: 1 });
milestoneSchema.index({ 'completions.userId': 1 });

/**
 * Whether this milestone is done for a given user.
 *
 * In 'shared' mode there is only one answer and it is the same for everyone.
 * In 'separate' mode each member has their own entry in `completions` —
 * except the owner, whose progress predates that array and still lives in
 * `status`, so it is used as a fallback rather than showing lost progress.
 */
milestoneSchema.methods.isCompletedBy = function (userId, ownerId, mode = 'separate') {
  if (mode === 'shared') return this.status === 'completed';
  if (this.completions.some((c) => String(c.userId) === String(userId))) return true;
  if (ownerId && String(userId) === String(ownerId)) return this.status === 'completed';
  return false;
};

module.exports = mongoose.model('Milestone', milestoneSchema);
