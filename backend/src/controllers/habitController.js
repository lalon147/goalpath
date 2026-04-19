const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const asyncHandler = require('../middleware/asyncHandler');

exports.createHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.create({ ...req.body, userId: req.user._id });
  return res.status(201).json({ success: true, data: habit });
});

exports.getHabits = asyncHandler(async (req, res) => {
  const { status, goalId } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (goalId) filter.goalId = goalId;

  const habits = await Habit.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: habits });
});

exports.getHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }
  return res.status(200).json({ success: true, data: habit });
});

exports.updateHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.habitId, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }
  return res.status(200).json({ success: true, data: habit });
});

exports.deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }
  await HabitLog.deleteMany({ habitId: habit._id });
  return res.status(200).json({ success: true, message: 'Habit deleted successfully' });
});
