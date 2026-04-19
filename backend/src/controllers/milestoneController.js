const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const asyncHandler = require('../middleware/asyncHandler');

const getGoalOrFail = async (goalId, userId, res) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Goal not found' }
    });
    return null;
  }
  return goal;
};

exports.createMilestone = asyncHandler(async (req, res) => {
  const goal = await getGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const count = await Milestone.countDocuments({ goalId: goal._id });
  const milestone = await Milestone.create({
    ...req.body,
    goalId: goal._id,
    order: count + 1
  });

  goal.milestones.push(milestone._id);
  await goal.recalculateProgress();
  await goal.save();

  return res.status(201).json({ success: true, data: milestone });
});

exports.getMilestones = asyncHandler(async (req, res) => {
  const goal = await getGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const filter = { goalId: goal._id };
  if (req.query.status) filter.status = req.query.status;

  const milestones = await Milestone.find(filter).sort({ order: 1 });

  return res.status(200).json({ success: true, data: milestones });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  const goal = await getGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const milestone = await Milestone.findOneAndUpdate(
    { _id: req.params.milestoneId, goalId: goal._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!milestone) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Milestone not found' }
    });
  }

  if (req.body.status) {
    await goal.recalculateProgress();
    await goal.save();
  }

  return res.status(200).json({ success: true, data: milestone });
});

exports.completeMilestone = asyncHandler(async (req, res) => {
  const goal = await getGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const now = new Date();
  const milestone = await Milestone.findOneAndUpdate(
    { _id: req.params.milestoneId, goalId: goal._id },
    { $set: { status: 'completed', completedDate: now, completedAt: now } },
    { new: true }
  );

  if (!milestone) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Milestone not found' }
    });
  }

  await goal.recalculateProgress();
  if (goal.totalMilestones > 0 && goal.completionPercentage === 100) {
    goal.status = 'completed';
  }
  await goal.save();

  return res.status(200).json({
    success: true,
    data: {
      id: milestone._id,
      status: milestone.status,
      completedDate: milestone.completedDate
    }
  });
});

exports.deleteMilestone = asyncHandler(async (req, res) => {
  const goal = await getGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const milestone = await Milestone.findOneAndDelete({
    _id: req.params.milestoneId,
    goalId: goal._id
  });

  if (!milestone) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Milestone not found' }
    });
  }

  goal.milestones = goal.milestones.filter(id => !id.equals(milestone._id));
  await goal.recalculateProgress();
  await goal.save();

  return res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
});
