const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  logDate: { type: Date, required: [true, 'Log date is required'] },
  status: {
    type: String,
    enum: ['completed', 'skipped', 'failed'],
    required: [true, 'Status is required']
  },
  notes: { type: String, maxlength: [500, 'Notes too long'], default: '' },
  duration: { type: Number, min: 0 },
  intensity: { type: String, enum: ['low', 'medium', 'high'] },
  loggedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

habitLogSchema.index({ habitId: 1, logDate: -1 });
habitLogSchema.index({ userId: 1, logDate: -1 });
habitLogSchema.index({ logDate: 1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);
