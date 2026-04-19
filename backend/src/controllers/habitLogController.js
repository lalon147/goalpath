const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const asyncHandler = require('../middleware/asyncHandler');

const recalculateStreak = async (habit) => {
  const logs = await HabitLog.find({ habitId: habit._id, status: 'completed' })
    .sort({ logDate: -1 })
    .lean();

  if (logs.length === 0) {
    habit.currentStreak = 0;
    return;
  }

  const msPerDay = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let expected = new Date(today);

  // Allow today or yesterday as start (grace period for end-of-day logging)
  const firstLogDate = new Date(logs[0].logDate);
  firstLogDate.setHours(0, 0, 0, 0);
  const gap = (expected - firstLogDate) / msPerDay;
  if (gap > 1) {
    habit.currentStreak = 0;
    return;
  }
  if (gap === 1) expected = firstLogDate;

  for (const log of logs) {
    const logDay = new Date(log.logDate);
    logDay.setHours(0, 0, 0, 0);
    if (logDay.getTime() === expected.getTime()) {
      streak++;
      expected = new Date(expected.getTime() - msPerDay);
    } else if (logDay < expected) {
      break;
    }
  }

  habit.currentStreak = streak;
  if (streak > habit.longestStreak) habit.longestStreak = streak;
};

exports.logHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const logDate = new Date(req.body.logDate);
  logDate.setHours(0, 0, 0, 0);

  // Prevent duplicate logs for the same day
  const existing = await HabitLog.findOne({ habitId: habit._id, logDate });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Habit already logged for this date' }
    });
  }

  const log = await HabitLog.create({
    ...req.body,
    logDate,
    habitId: habit._id,
    userId: req.user._id,
    loggedAt: new Date()
  });

  if (req.body.status === 'completed') {
    habit.totalCompletions += 1;
    await recalculateStreak(habit);
  }
  await habit.save();

  return res.status(201).json({ success: true, data: log });
});

exports.getLogs = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const { startDate, endDate, status, limit = 30, page = 1 } = req.query;
  const filter = { habitId: habit._id };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.logDate = {};
    if (startDate) filter.logDate.$gte = new Date(startDate);
    if (endDate) filter.logDate.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    HabitLog.find(filter).sort({ logDate: -1 }).skip(skip).limit(limitNum).lean(),
    HabitLog.countDocuments(filter)
  ]);

  const completedCount = await HabitLog.countDocuments({ habitId: habit._id, status: 'completed' });
  const totalLogs = await HabitLog.countDocuments({ habitId: habit._id });
  const completionRate = totalLogs > 0 ? Math.round((completedCount / totalLogs) * 100) / 100 : 0;

  return res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      statistics: {
        totalLogged: completedCount,
        completionRate,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak
      }
    }
  });
});

exports.updateLog = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const log = await HabitLog.findOneAndUpdate(
    { _id: req.params.logId, habitId: habit._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!log) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Log not found' }
    });
  }

  await recalculateStreak(habit);
  await habit.save();

  return res.status(200).json({ success: true, data: log });
});

exports.deleteLog = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const log = await HabitLog.findOneAndDelete({ _id: req.params.logId, habitId: habit._id });
  if (!log) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Log not found' }
    });
  }

  if (log.status === 'completed') {
    habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
    await recalculateStreak(habit);
  }
  await habit.save();

  return res.status(200).json({ success: true, message: 'Log deleted successfully' });
});
