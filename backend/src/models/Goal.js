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
  habits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }],

  // How a shared goal counts progress:
  //   separate — everyone works the same milestone list on their own copy, and
  //              each person has their own percentage (a race, or parallel runs)
  //   shared   — one tick list for the whole group; whoever completes a
  //              milestone completes it for everybody (a joint project)
  // Goals that are not shared at all are simply goals with no members, which is
  // the "different goal, different progress" case and needs nothing here.
  progressMode: {
    type: String,
    enum: ['separate', 'shared'],
    default: 'separate'
  },

  // Shared goals: `userId` stays the owner, `members` are everyone else who was
  // invited.
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['invited', 'active', 'declined'], default: 'invited' },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: null }
  }]
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ userId: 1, targetDate: 1 });
// Lets "goals shared with me" be a single indexed query rather than a scan.
goalSchema.index({ 'members.userId': 1, 'members.status': 1 });

/** True when this user owns the goal or has joined it. */
goalSchema.methods.isParticipant = function (userId) {
  if (String(this.userId) === String(userId)) return true;
  return this.members.some(
    (m) => String(m.userId) === String(userId) && m.status === 'active'
  );
};

/** Owner plus everyone who accepted — the people who appear on the leaderboard. */
goalSchema.methods.participantIds = function () {
  return [
    this.userId,
    ...this.members.filter((m) => m.status === 'active').map((m) => m.userId)
  ];
};

goalSchema.methods.recalculateProgress = async function () {
  const Milestone = mongoose.model('Milestone');
  const total = await Milestone.countDocuments({ goalId: this._id });
  const completed = await Milestone.countDocuments({ goalId: this._id, status: 'completed' });
  this.totalMilestones = total;
  this.completedMilestones = completed;
  this.completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
};

module.exports = mongoose.model('Goal', goalSchema);
