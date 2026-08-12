const User = require('../models/User');
const Friendship = require('../models/Friendship');
const asyncHandler = require('../middleware/asyncHandler');

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

/**
 * The username is the identity here. No email is ever returned: accounts
 * created after PII-free signup have none, and the ones that predate it must
 * not have theirs handed to anyone who types into a search box.
 */
const publicUser = (u) => ({
  id: u._id,
  username: u.username,
  displayName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
  profilePicture: u.profilePicture || null
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/friends/search?q=
exports.search = asyncHandler(async (req, res) => {
  // A leading @ is how people write usernames, so accept it and ignore it.
  const q = String(req.query.q || '').trim().replace(/^@+/, '');
  if (q.length < 2) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Escaped before it reaches the regex: an unescaped user string would let
  // someone pass a pattern that scans far more than they asked for.
  const rx = new RegExp(escapeRegex(q), 'i');

  const users = await User.find({
    _id: { $ne: req.user._id },
    status: 'active',
    // Names are still matched so long-standing accounts stay findable, but
    // username is the field that always exists.
    $or: [{ username: rx }, { firstName: rx }, { lastName: rx }]
  })
    .select('username firstName lastName profilePicture')
    .limit(20)
    .lean();

  // Annotate each hit with the current relationship so the client can render
  // "Add" / "Requested" / "Friends" without a second round trip.
  const rows = await Friendship.involving(req.user._id).lean();
  const byOther = new Map();
  rows.forEach((r) => {
    const other = String(r.requester) === String(req.user._id) ? r.recipient : r.requester;
    byOther.set(String(other), r);
  });

  const data = users.map((u) => {
    const rel = byOther.get(String(u._id));
    let relationship = 'none';
    if (rel) {
      if (rel.status === 'accepted') relationship = 'friends';
      else if (rel.status === 'pending') {
        relationship = String(rel.requester) === String(req.user._id) ? 'requested' : 'awaiting-you';
      }
    }
    return { ...publicUser(u), relationship, friendshipId: rel?._id || null };
  });

  // Someone typing a full username wants that account, not the twelve others
  // that happen to contain it as a substring.
  const needle = q.toLowerCase();
  data.sort((a, b) => {
    const aExact = a.username === needle ? 0 : 1;
    const bExact = b.username === needle ? 0 : 1;
    return aExact - bExact || a.username.localeCompare(b.username);
  });

  return res.status(200).json({ success: true, data });
});

// GET /api/friends
exports.list = asyncHandler(async (req, res) => {
  const rows = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: req.user._id }, { recipient: req.user._id }]
  })
    .populate('requester recipient', 'username firstName lastName profilePicture')
    .lean();

  const data = rows.map((r) => {
    const other = String(r.requester._id) === String(req.user._id) ? r.recipient : r.requester;
    return { friendshipId: r._id, since: r.respondedAt, ...publicUser(other) };
  });

  return res.status(200).json({ success: true, data });
});

// GET /api/friends/requests
exports.listRequests = asyncHandler(async (req, res) => {
  const rows = await Friendship.find({ status: 'pending', $or: [{ requester: req.user._id }, { recipient: req.user._id }] })
    .populate('requester recipient', 'username firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  const incoming = [];
  const outgoing = [];
  rows.forEach((r) => {
    if (String(r.recipient._id) === String(req.user._id)) {
      incoming.push({ friendshipId: r._id, sentAt: r.createdAt, ...publicUser(r.requester) });
    } else {
      outgoing.push({ friendshipId: r._id, sentAt: r.createdAt, ...publicUser(r.recipient) });
    }
  });

  return res.status(200).json({ success: true, data: { incoming, outgoing } });
});

// POST /api/friends/requests  { userId } or { username }
//
// Accepting a username means "add @someone" works straight from a typed box or
// a shared handle, with no search call first.
exports.sendRequest = asyncHandler(async (req, res) => {
  const target = req.body.username
    ? await User.findOne({ username: User.normalizeUsername(req.body.username) })
    : await User.findById(req.body.userId);

  if (!target || target.status !== 'active') {
    return fail(res, 404, 'NOT_FOUND', 'That user does not exist');
  }

  const userId = target._id;

  if (String(userId) === String(req.user._id)) {
    return fail(res, 400, 'INVALID_REQUEST', 'You cannot add yourself');
  }

  // Check both directions: if they already asked you, accepting is the sane
  // outcome rather than creating a second, mirror-image pending row.
  const existing = await Friendship.findOne({
    $or: [
      { requester: req.user._id, recipient: userId },
      { requester: userId, recipient: req.user._id }
    ]
  });

  if (existing) {
    if (existing.status === 'accepted') {
      return fail(res, 409, 'ALREADY_FRIENDS', 'You are already friends');
    }
    if (existing.status === 'pending') {
      if (String(existing.recipient) === String(req.user._id)) {
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        await existing.save();
        return res.status(200).json({ success: true, data: { friendshipId: existing._id, status: 'accepted' } });
      }
      return fail(res, 409, 'ALREADY_REQUESTED', 'You already sent a request to this person');
    }
    // A previously declined request can be sent again.
    existing.requester = req.user._id;
    existing.recipient = userId;
    existing.status = 'pending';
    existing.respondedAt = null;
    await existing.save();
    return res.status(201).json({ success: true, data: { friendshipId: existing._id, status: 'pending' } });
  }

  const created = await Friendship.create({ requester: req.user._id, recipient: userId });
  return res.status(201).json({ success: true, data: { friendshipId: created._id, status: 'pending' } });
});

const respond = (nextStatus) => asyncHandler(async (req, res) => {
  const row = await Friendship.findById(req.params.friendshipId);
  if (!row) return fail(res, 404, 'NOT_FOUND', 'Request not found');

  // Only the recipient may answer — otherwise the sender could accept on the
  // other person's behalf.
  if (String(row.recipient) !== String(req.user._id)) {
    return fail(res, 403, 'FORBIDDEN', 'This request is not yours to answer');
  }
  if (row.status !== 'pending') {
    return fail(res, 409, 'ALREADY_ANSWERED', 'This request was already answered');
  }

  row.status = nextStatus;
  row.respondedAt = new Date();
  await row.save();

  return res.status(200).json({ success: true, data: { friendshipId: row._id, status: row.status } });
});

exports.accept = respond('accepted');
exports.decline = respond('declined');

// DELETE /api/friends/:friendshipId — unfriend, or cancel a request you sent
exports.remove = asyncHandler(async (req, res) => {
  const row = await Friendship.findById(req.params.friendshipId);
  if (!row) return fail(res, 404, 'NOT_FOUND', 'Not found');

  const mine = [String(row.requester), String(row.recipient)].includes(String(req.user._id));
  if (!mine) return fail(res, 403, 'FORBIDDEN', 'Not yours to remove');

  await row.deleteOne();
  return res.status(200).json({ success: true, message: 'Removed' });
});
