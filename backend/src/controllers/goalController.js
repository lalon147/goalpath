const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const asyncHandler = require('../middleware/asyncHandler');

exports.createGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.create({ ...req.body, userId: req.user._id });

  return res.status(201).json({
    success: true,
    data: goal
  });
});

exports.getGoals = asyncHandler(async (req, res) => {
  const { status, category, sortBy = 'createdAt', order = 'desc', limit = 20, page = 1 } = req.query;

  // Goals you own plus goals you joined. Invitations you haven't answered are
  // deliberately excluded — they surface separately so an unanswered invite
  // doesn't sit in your list looking like something you committed to.
  const filter = {
    $or: [
      { userId: req.user._id },
      { members: { $elemMatch: { userId: req.user._id, status: 'active' } } }
    ]
  };
  if (status) filter.status = status;
  if (category) filter.category = category;

  const sortOrder = order === 'asc' ? 1 : -1;
  const allowedSortFields = ['createdAt', 'targetDate', 'priority', 'title'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [goals, total] = await Promise.all([
    Goal.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limitNum).lean(),
    Goal.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: {
      goals,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    }
  });
});

exports.getGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.goalId)
    .populate('milestones', 'title status completedDate targetDate order completions')
    .populate('habits', 'title frequency currentStreak status');

  // Members can open a shared goal, so ownership is checked separately from
  // existence — but both answer 404 so this can't be used to probe for ids.
  if (!goal || !goal.isParticipant(req.user._id)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Goal not found' }
    });
  }

  // On a shared goal the stored completionPercentage is the owner's. Everyone
  // needs their own, so it is computed for the caller here.
  const isOwner = String(goal.userId) === String(req.user._id);
  const mode = goal.progressMode || 'separate';
  const total = goal.milestones.length;
  const completed = goal.milestones.filter((m) =>
    m.isCompletedBy(req.user._id, goal.userId, mode)
  ).length;

  const data = goal.toObject();
  data.isOwner = isOwner;
  data.myProgress = {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
  data.milestones = goal.milestones.map((m) => ({
    ...m.toObject(),
    completedByMe: m.isCompletedBy(req.user._id, goal.userId, mode)
  }));

  return res.status(200).json({ success: true, data });
});

exports.updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.goalId, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('milestones', 'title status completedDate targetDate order')
   .populate('habits', 'title frequency currentStreak status');

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Goal not found' }
    });
  }

  return res.status(200).json({ success: true, data: goal });
});

exports.deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.goalId, userId: req.user._id });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Goal not found' }
    });
  }

  await Milestone.deleteMany({ goalId: goal._id });

  return res.status(200).json({ success: true, message: 'Goal deleted successfully' });
});
