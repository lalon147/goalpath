const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  respondedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// One row per ordered pair. The reverse pair (B -> A while A -> B exists) is
// blocked in the controller instead, since a unique index can't express it.
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });

/** Every friendship row involving this user, in either direction. */
friendshipSchema.statics.involving = function (userId, status) {
  const filter = { $or: [{ requester: userId }, { recipient: userId }] };
  if (status) filter.status = status;
  return this.find(filter);
};

/** The set of user IDs this user is actually friends with. */
friendshipSchema.statics.friendIdsOf = async function (userId) {
  const rows = await this.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }]
  }).lean();

  return rows.map((r) =>
    String(r.requester) === String(userId) ? r.recipient : r.requester
  );
};

module.exports = mongoose.model('Friendship', friendshipSchema);
