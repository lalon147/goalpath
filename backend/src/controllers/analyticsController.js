const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const asyncHandler = require('../middleware/asyncHandler');

exports.getGoalProgress = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.goalId, userId: req.user._id });
  if (!goal) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Goal not found' }
    });
  }

  const milestones = await Milestone.find({ goalId: goal._id }).sort({ order: 1 }).lean();
  const habits = await Habit.find({ goalId: goal._id, userId: req.user._id }).lean();

  const habitStats = await Promise.all(habits.map(async (habit) => {
    const total = await HabitLog.countDocuments({ habitId: habit._id });
    const completed = await HabitLog.countDocuments({ habitId: habit._id, status: 'completed' });
    return {
      habitId: habit._id,
      title: habit.title,
      completionRate: total > 0 ? Math.round((completed / total) * 100) / 100 : 0,
      currentStreak: habit.currentStreak,
      totalCompletions: habit.totalCompletions
    };
  }));

  const daysRemaining = goal.targetDate
    ? Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / 86400000))
    : null;

  return res.status(200).json({
    success: true,
    data: {
      goalId: goal._id,
      title: goal.title,
      completionPercentage: goal.completionPercentage,
      totalMilestones: goal.totalMilestones,
      completedMilestones: goal.completedMilestones,
      status: goal.status,
      daysRemaining,
      habits: habitStats,
      milestoneProgress: milestones.map(m => ({
        order: m.order,
        title: m.title,
        status: m.status,
        completedDate: m.completedDate,
        targetDate: m.targetDate
      }))
    }
  });
});

exports.getHabitStats = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.user._id });
  if (!habit) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Habit not found' }
    });
  }

  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate.getTime() - 30 * 86400000);

  const logs = await HabitLog.find({
    habitId: habit._id,
    logDate: { $gte: startDate, $lte: endDate }
  }).sort({ logDate: -1 }).lean();

  const completed = logs.filter(l => l.status === 'completed');
  const skipped = logs.filter(l => l.status === 'skipped');
  const failed = logs.filter(l => l.status === 'failed');
  const totalDuration = completed.reduce((sum, l) => sum + (l.duration || 0), 0);
  const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

  return res.status(200).json({
    success: true,
    data: {
      habitId: habit._id,
      title: habit.title,
      totalLogged: completed.length,
      completionRate: logs.length > 0 ? Math.round((completed.length / logs.length) * 100) / 100 : 0,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      averageDuration: avgDuration,
      totalDuration,
      frequencyBreakdown: {
        completed: completed.length,
        skipped: skipped.length,
        failed: failed.length
      },
      dailyBreakdown: logs.map(l => ({
        date: l.logDate.toISOString().split('T')[0],
        status: l.status,
        duration: l.duration
      }))
    }
  });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [goals, habits] = await Promise.all([
    Goal.find({ userId }).lean(),
    Habit.find({ userId }).lean()
  ]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const activeHabits = habits.filter(h => h.status === 'active');

  // Weekly habit completion rate (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weeklyLogs = await HabitLog.find({ userId, logDate: { $gte: weekAgo } }).lean();
  const weeklyCompleted = weeklyLogs.filter(l => l.status === 'completed').length;
  const weeklyRate = weeklyLogs.length > 0
    ? Math.round((weeklyCompleted / weeklyLogs.length) * 100) / 100
    : 0;

  const completedMilestones = await Milestone.find({
    goalId: { $in: goals.map(g => g._id) },
    status: 'completed'
  }).countDocuments();

  // Milestones completed this week
  const weeklyMilestones = await Milestone.find({
    goalId: { $in: goals.map(g => g._id) },
    status: 'completed',
    completedAt: { $gte: weekAgo }
  }).countDocuments();

  const streaksActive = habits.filter(h => h.currentStreak >= 7).length;

  // Recent activity: last 5 completed milestones
  const recentMilestones = await Milestone.find({
    goalId: { $in: goals.map(g => g._id) },
    status: 'completed'
  }).sort({ completedAt: -1 }).limit(5).lean();

  const goalMap = Object.fromEntries(goals.map(g => [g._id.toString(), g.title]));
  const recentActivity = recentMilestones.map(m => ({
    type: 'milestone_completed',
    goalTitle: goalMap[m.goalId.toString()],
    milestoneTitle: m.title,
    completedDate: m.completedAt
  }));

  return res.status(200).json({
    success: true,
    data: {
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        completedMilestones,
        totalHabits: habits.length,
        activeHabits: activeHabits.length
      },
      weeklyStats: {
        habitCompletionRate: weeklyRate,
        milestonesAchieved: weeklyMilestones,
        streaksActive
      },
      recentActivity,
      goals: activeGoals.map(g => ({
        id: g._id,
        title: g.title,
        completionPercentage: g.completionPercentage,
        status: g.status,
        targetDate: g.targetDate
      }))
    }
  });
});
