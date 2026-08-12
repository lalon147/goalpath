const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const asyncHandler = require('../middleware/asyncHandler');

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

/**
 * Progress for one participant on a shared goal.
 *
 * In 'separate' mode this counts that person's own completions rather than the
 * goal's stored completionPercentage (which only ever reflected the owner). In
 * 'shared' mode everyone necessarily gets the same numbers.
 */
const progressFor = (milestones, userId, ownerId, mode = 'separate') => {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.isCompletedBy(userId, ownerId, mode)).length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

// POST /api/goals/:goalId/members  { userId } or { username }
exports.invite = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.goalId);

  if (!goal) return fail(res, 404, 'NOT_FOUND', 'Goal not found');
  if (String(goal.userId) !== String(req.user._id)) {
    return fail(res, 403, 'FORBIDDEN', 'Only the goal owner can invite people');
  }

  const target = req.body.username
    ? await User.findOne({ username: User.normalizeUsername(req.body.username) }).select('username firstName lastName')
    : await User.findById(req.body.userId).select('username firstName lastName');

  if (!target) return fail(res, 404, 'NOT_FOUND', 'That user does not exist');

  const userId = target._id;

  if (String(userId) === String(req.user._id)) {
    return fail(res, 400, 'INVALID_REQUEST', 'You are already on this goal');
  }

  // Friends only. Without this check any user id could be pushed onto a
  // stranger's goal list, which is a spam vector rather than a feature.
  const friendIds = await Friendship.friendIdsOf(req.user._id);
  if (!friendIds.some((id) => String(id) === String(userId))) {
    return fail(res, 403, 'NOT_FRIENDS', 'You can only invite friends to a goal');
  }

  const existing = goal.members.find((m) => String(m.userId) === String(userId));
  if (existing && existing.status !== 'declined') {
    return fail(res, 409, 'ALREADY_INVITED', 'That person is already on this goal');
  }

  if (existing) {
    existing.status = 'invited';
    existing.invitedAt = new Date();
    existing.joinedAt = null;
  } else {
    goal.members.push({ userId, status: 'invited' });
  }

  goal.isShared = true;
  await goal.save();

  return res.status(201).json({
    success: true,
    data: { goalId: goal._id, userId, username: target.username, status: 'invited' }
  });
});

// GET /api/goals/invitations/pending — goal invites waiting on you.
// Separate from GET /goals on purpose: an unanswered invite is not yet one of
// your goals and should not appear in that list.
exports.listInvitations = asyncHandler(async (req, res) => {
  const goals = await Goal.find({
    members: { $elemMatch: { userId: req.user._id, status: 'invited' } }
  })
    .populate('userId', 'username firstName lastName profilePicture')
    .select('title description category emoji color progressMode userId members createdAt')
    .lean();

  const data = goals.map((g) => {
    const owner = g.userId || {};
    const invite = g.members.find((m) => String(m.userId) === String(req.user._id));
    return {
      goalId: g._id,
      title: g.title,
      description: g.description,
      category: g.category,
      emoji: g.emoji,
      color: g.color,
      progressMode: g.progressMode || 'separate',
      invitedAt: invite?.invitedAt || g.createdAt,
      owner: {
        id: owner._id,
        username: owner.username,
        displayName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.username,
        profilePicture: owner.profilePicture || null
      }
    };
  });

  return res.status(200).json({ success: true, data });
});

// POST /api/goals/:goalId/members/respond  { accept: true|false }
exports.respond = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.goalId);
  if (!goal) return fail(res, 404, 'NOT_FOUND', 'Goal not found');

  const member = goal.members.find((m) => String(m.userId) === String(req.user._id));
  if (!member) return fail(res, 404, 'NOT_INVITED', 'You were not invited to this goal');
  if (member.status !== 'invited') {
    return fail(res, 409, 'ALREADY_ANSWERED', 'You already answered this invitation');
  }

  const accept = req.body.accept !== false;
  member.status = accept ? 'active' : 'declined';
  member.joinedAt = accept ? new Date() : null;
  await goal.save();

  return res.status(200).json({
    success: true,
    data: { goalId: goal._id, status: member.status }
  });
});

// GET /api/goals/:goalId/leaderboard
exports.leaderboard = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.goalId);
  if (!goal) return fail(res, 404, 'NOT_FOUND', 'Goal not found');
  if (!goal.isParticipant(req.user._id)) {
    return fail(res, 403, 'FORBIDDEN', 'You are not part of this goal');
  }

  const mode = goal.progressMode || 'separate';
  const milestones = await Milestone.find({ goalId: goal._id }).sort({ order: 1 });
  const ids = goal.participantIds();
  const users = await User.find({ _id: { $in: ids } })
    .select('username firstName lastName profilePicture')
    .lean();

  const byId = new Map(users.map((u) => [String(u._id), u]));

  const rows = ids
    .map((id) => {
      const u = byId.get(String(id));
      if (!u) return null;
      return {
        userId: u._id,
        username: u.username,
        displayName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        profilePicture: u.profilePicture || null,
        isOwner: String(id) === String(goal.userId),
        isYou: String(id) === String(req.user._id),
        ...progressFor(milestones, id, goal.userId, mode)
      };
    })
    .filter(Boolean)
    // Ties broken by username so the order doesn't jitter between requests.
    .sort((a, b) => b.percentage - a.percentage || a.username.localeCompare(b.username));

  return res.status(200).json({
    success: true,
    data: {
      goalId: goal._id,
      title: goal.title,
      progressMode: mode,
      pending: goal.members.filter((m) => m.status === 'invited').length,
      members: rows,
      milestones: milestones.map((m) => ({
        id: m._id,
        title: m.title,
        order: m.order,
        // In shared mode this is whoever ticked it for the group; in separate
        // mode it is everyone who has ticked their own copy.
        completedBy: mode === 'shared'
          ? (m.status === 'completed' && m.completedBy ? [String(m.completedBy)] : [])
          : ids.filter((id) => m.isCompletedBy(id, goal.userId, mode)).map(String)
      }))
    }
  });
});

// DELETE /api/goals/:goalId/members/:userId — owner removes someone, or you leave
exports.remove = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.goalId);
  if (!goal) return fail(res, 404, 'NOT_FOUND', 'Goal not found');

  const targetId = req.params.userId;
  const isOwner = String(goal.userId) === String(req.user._id);
  const isSelf = String(targetId) === String(req.user._id);

  if (!isOwner && !isSelf) {
    return fail(res, 403, 'FORBIDDEN', 'You can only remove yourself');
  }
  if (String(goal.userId) === String(targetId)) {
    return fail(res, 400, 'INVALID_REQUEST', 'The owner cannot leave their own goal');
  }

  const before = goal.members.length;
  goal.members = goal.members.filter((m) => String(m.userId) !== String(targetId));
  if (goal.members.length === before) {
    return fail(res, 404, 'NOT_FOUND', 'That person is not on this goal');
  }

  goal.isShared = goal.members.some((m) => m.status !== 'declined');
  await goal.save();

  // Their milestone ticks go with them, so re-joining later starts clean.
  await Milestone.updateMany(
    { goalId: goal._id },
    { $pull: { completions: { userId: targetId } } }
  );

  return res.status(200).json({ success: true, message: 'Removed from goal' });
});

exports.progressFor = progressFor;
