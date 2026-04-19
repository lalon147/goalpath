const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  time: { type: String },
  message: { type: String },
  enabled: { type: Boolean, default: true }
}, { _id: false });

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title too long']
  },
  description: { type: String, trim: true, maxlength: [1000], default: '' },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: [true, 'Frequency is required']
  },
  daysOfWeek: [{ type: Number, min: 0, max: 6 }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalCompletions: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  reminders: [reminderSchema]
}, {
  timestamps: true
});

habitSchema.index({ userId: 1, status: 1 });
habitSchema.index({ userId: 1, goalId: 1 });

module.exports = mongoose.model('Habit', habitSchema);
