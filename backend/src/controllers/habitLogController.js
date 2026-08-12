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

/** Local midnight for a Y-M-D string, or for today when none is given. */
const startOfDay = (value) => {
  const d = value ? new Date(value) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Monday of the week containing `date`. */
const startOfWeek = (date) => {
  const d = startOfDay(date);
  // getDay() is 0 for Sunday, which belongs to the week that began six days
  // earlier rather than starting a new one.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
};

const DAY_MS = 86400000;
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * GET /api/habits/logs/week?start=YYYY-MM-DD
 *
 * Every active habit crossed with the seven days of one week, which is what a
 * week grid needs. Doing this per-habit meant one request per row and no way to
 * see the week as a whole.
 */
exports.getWeek = asyncHandler(async (req, res) => {
  const weekStart = startOfWeek(req.query.start);
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);
  const today = startOfDay();

  const habits = await Habit.find({ userId: req.user._id, status: { $ne: 'completed' } })
    .select('title emoji frequency daysOfWeek targetValue unit currentStreak longestStreak status')
    .sort({ createdAt: 1 })
    .lean();

  const logs = await HabitLog.find({
    userId: req.user._id,
    logDate: { $gte: weekStart, $lte: new Date(weekEnd.getTime() + DAY_MS - 1) }
  }).lean();

  // Keyed by habit + day so each cell is a direct lookup instead of a scan.
  const byCell = new Map();
  logs.forEach((l) => {
    byCell.set(`${l.habitId}|${ymd(new Date(l.logDate))}`, l);
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY_MS);
    return { date: ymd(d), weekday: d.getDay(), isToday: d.getTime() === today.getTime(), isFuture: d > today };
  });

  const rows = habits.map((h) => {
    // A weekly habit is due any day; a daily one with daysOfWeek set is only
    // due on those days. Cells that are not due are rendered as gaps rather
    // than as misses.
    const dueOn = (weekday) =>
      h.frequency === 'daily'
        ? (!h.daysOfWeek?.length || h.daysOfWeek.includes(weekday))
        : true;

    const cells = days.map((d) => {
      const log = byCell.get(`${h._id}|${d.date}`);
      return {
        date: d.date,
        due: dueOn(d.weekday),
        isFuture: d.isFuture,
        status: log?.status || null,
        value: log?.duration ?? null,
        notes: log?.notes || '',
        logId: log?._id || null
      };
    });

    const dueSoFar = cells.filter((c) => c.due && !c.isFuture).length;
    const done = cells.filter((c) => c.status === 'completed').length;

    return {
      habitId: h._id,
      title: h.title,
      emoji: h.emoji,
      frequency: h.frequency,
      targetValue: h.targetValue,
      unit: h.unit,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
      cells,
      done,
      dueSoFar,
      // Measured against days already reached, so a Tuesday check-in is not
      // reported as 29% just because the week has five days left in it.
      percentage: dueSoFar > 0 ? Math.round((done / dueSoFar) * 100) : 0
    };
  });

  const totalDue = rows.reduce((n, r) => n + r.dueSoFar, 0);
  const totalDone = rows.reduce((n, r) => n + r.done, 0);

  return res.status(200).json({
    success: true,
    data: {
      weekStart: ymd(weekStart),
      weekEnd: ymd(weekEnd),
      days,
      habits: rows,
      summary: {
        totalDue,
        totalDone,
        percentage: totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0,
        perfectDays: days.filter((d) => {
          if (d.isFuture) return false;
          const due = rows.filter((r) => r.cells.find((c) => c.date === d.date)?.due);
          if (due.length === 0) return false;
          return due.every((r) => r.cells.find((c) => c.date === d.date)?.status === 'completed');
        }).length
      }
    }
  });
});

/**
 * PUT /api/habits/:habitId/logs/by-date  { date, status, duration, notes }
 *
 * Upsert for one day. The week grid needs to set, change and clear a cell, and
 * the create-only endpoint answers 409 the second time a day is touched — which
 * makes a grid of toggles impossible to build on.
 */
exports.setLogForDate = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const logDate = startOfDay(req.body.date);
  if (logDate > startOfDay()) {
    return res.status(400).json({
      success: false,
      error: { code: 'FUTURE_DATE', message: 'You cannot log a day that has not happened yet' }
    });
  }

  const { status, duration, notes } = req.body;

  // A null status clears the day, which is how a mis-tap is undone.
  if (status === null) {
    await HabitLog.deleteOne({ habitId: habit._id, logDate });
  } else {
    await HabitLog.findOneAndUpdate(
      { habitId: habit._id, logDate },
      {
        $set: {
          status,
          ...(duration !== undefined ? { duration } : {}),
          ...(notes !== undefined ? { notes } : {}),
          loggedAt: new Date()
        },
        $setOnInsert: { userId: req.user._id, habitId: habit._id, logDate }
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  // Recounted from the logs rather than incremented: with backfilling and
  // clearing, a running total drifts out of step with what is actually stored.
  habit.totalCompletions = await HabitLog.countDocuments({
    habitId: habit._id,
    status: 'completed'
  });
  await recalculateStreak(habit);
  await habit.save();

  return res.status(200).json({
    success: true,
    data: {
      habitId: habit._id,
      date: ymd(logDate),
      status: status ?? null,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: habit.totalCompletions
    }
  });
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
