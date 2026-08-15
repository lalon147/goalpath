const mongoose = require('mongoose');

// Exported so the request validator uses this same list. It previously kept its
// own copy, which is how the two drifted: the validator accepted a habit with no
// category, and the schema then rejected it.
const CATEGORIES = ['health', 'learning', 'mindfulness', 'productivity', 'fitness', 'social'];

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
  emoji: { type: String, default: '⚡', maxlength: 10 },
  category: {
    type: String,
    // Having no category is a normal state — the clients only send one when the
    // user picks it or the suggestion engine guesses it. `null` has to be listed
    // explicitly: mongoose skips enum validation for `undefined` but not for
    // `null`, and the default below means the value is always the latter.
    enum: {
      values: [...CATEGORIES, null],
      message: '`{VALUE}` is not a valid category'
    },
    // The web form clears the field to an empty string, which the request
    // validator allows. Fold it into the same "unset" the default uses rather
    // than carrying two different empty values into the database.
    set: (value) => (value === '' ? null : value),
    default: null
  },
  targetValue: { type: Number, min: 1, default: 1 },
  unit: { type: String, trim: true, maxlength: 30, default: '' },
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

habitSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Habit', habitSchema);
