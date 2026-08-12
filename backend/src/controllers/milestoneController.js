const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const asyncHandler = require('../middleware/asyncHandler');

// Owner-only: editing the milestone list changes it for every member, so it
// stays with whoever created the goal.
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

// Owner or joined member — for reading the list and ticking off your own copy.
const getParticipantGoalOrFail = async (goalId, userId, res) => {
  const goal = await Goal.findById(goalId);
  if (!goal || !goal.isParticipant(userId)) {
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
  const goal = await getParticipantGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const filter = { goalId: goal._id };
  if (req.query.status) filter.status = req.query.status;

  const milestones = await Milestone.find(filter).sort({ order: 1 });

  return res.status(200).json({
    success: true,
    data: milestones.map((m) => ({
      ...m.toObject(),
      completedByMe: m.isCompletedBy(req.user._id, goal.userId, goal.progressMode)
    }))
  });
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

/**
 * Ticking a milestone off, for whoever is asking.
 *
 * Which record gets written depends on the goal's mode:
 *   shared   — one state for the group, so `status` is set and `completedBy`
 *              records who did it
 *   separate — the caller gets their own entry in `completions`
 *
 * The owner additionally keeps writing `status` in separate mode. That field is
 * what `recalculateProgress`, the goals list and every pre-existing screen read,
 * so leaving it behind would make the owner's own progress silently stop moving.
 */
const setCompletion = (done) => asyncHandler(async (req, res) => {
  const goal = await getParticipantGoalOrFail(req.params.goalId, req.user._id, res);
  if (!goal) return;

  const milestone = await Milestone.findOne({
    _id: req.params.milestoneId,
    goalId: goal._id
  });

  if (!milestone) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Milestone not found' }
    });
  }

  const shared = goal.progressMode === 'shared';
  const isOwner = String(goal.userId) === String(req.user._id);
  const now = new Date();

  if (shared || isOwner) {
    milestone.status = done ? 'completed' : 'pending';
    milestone.completedDate = done ? now : null;
    milestone.completedAt = done ? now : null;
    if (shared) milestone.completedBy = done ? req.user._id : null;
  }

  if (!shared) {
    const mine = (c) => String(c.userId) === String(req.user._id);
    if (done) {
      // Guarded so completing twice does not stack duplicate entries, which
      // would not change isCompletedBy but would quietly grow the document.
      if (!milestone.completions.some(mine)) {
        milestone.completions.push({ userId: req.user._id, completedAt: now });
      }
    } else {
      milestone.completions = milestone.completions.filter((c) => !mine(c));
    }
  }

  await milestone.save();

  // completionPercentage on the goal tracks `status`, so it only means anything
  // when this call actually touched it.
  if (shared || isOwner) {
    await goal.recalculateProgress();
    if (done && goal.totalMilestones > 0 && goal.completionPercentage === 100) {
      goal.status = 'completed';
    } else if (!done && goal.status === 'completed') {
      goal.status = 'active';
    }
    await goal.save();
  }

  return res.status(200).json({
    success: true,
    data: {
      id: milestone._id,
      status: milestone.status,
      completedDate: milestone.completedDate,
      completedByMe: milestone.isCompletedBy(req.user._id, goal.userId, goal.progressMode)
    }
  });
});

exports.completeMilestone = setCompletion(true);
exports.uncompleteMilestone = setCompletion(false);

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
