/**
 * Removes the seed and test accounts left over from development, along with
 * everything they own.
 *
 * The accounts are named explicitly rather than matched by a pattern like
 * /test/: a pattern is one typo away from deleting a real account, and the
 * names here are known and finite. Anything not on this list is left alone.
 *
 *   node scripts/delete-test-accounts.js --dry    # report only
 *   node scripts/delete-test-accounts.js          # apply
 */

require('dotenv').config();
const mongoose = require('mongoose');

const DRY = process.argv.includes('--dry');

const DOOMED = [
  'johndoe', 'johndoe2', 'testuser', 'corstest', 'logintest', 'uservt',
  'browsertest', 'browsertest2', 'duptest', 'spectest', 'aliastest',
  'obrienmuoz', 'minimin', 'userrt', 'userrt2', 'userst', 'uireset',
  'uireset2', 'userpr'
];

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`connected to "${db.databaseName}"${DRY ? ' (dry run — nothing will be written)' : ''}\n`);

  const users = await db.collection('users')
    .find({ username: { $in: DOOMED } }, { projection: { username: 1 } })
    .toArray();

  const ids = users.map((u) => u._id);
  console.log(`matched ${users.length} of ${DOOMED.length} named accounts`);

  const survivors = await db.collection('users')
    .find({ username: { $nin: DOOMED } }, { projection: { username: 1 } })
    .toArray();
  console.log(`keeping ${survivors.length}: ${survivors.map((u) => '@' + u.username).join(', ')}\n`);

  if (ids.length === 0) {
    console.log('nothing to do');
    await mongoose.disconnect();
    return;
  }

  // Milestones hang off goals rather than users, so their goals are collected
  // before the goals themselves are removed.
  const goalIds = (await db.collection('goals')
    .find({ userId: { $in: ids } }, { projection: { _id: 1 } })
    .toArray()).map((g) => g._id);

  const plan = [
    ['milestones', { goalId: { $in: goalIds } }],
    ['goals', { userId: { $in: ids } }],
    ['habitlogs', { userId: { $in: ids } }],
    ['habits', { userId: { $in: ids } }],
    // Either side of a friendship is enough to make the row meaningless.
    ['friendships', { $or: [{ requester: { $in: ids } }, { recipient: { $in: ids } }] }],
    ['users', { _id: { $in: ids } }]
  ];

  for (const [name, filter] of plan) {
    const n = await db.collection(name).countDocuments(filter);
    if (DRY) {
      console.log(`  would delete ${n} from ${name}`);
    } else {
      const { deletedCount } = await db.collection(name).deleteMany(filter);
      console.log(`  deleted ${deletedCount} from ${name}`);
    }
  }

  // A deleted member still sitting in someone else's goal would show as a blank
  // row on that goal's leaderboard.
  const pull = { $pull: { members: { userId: { $in: ids } } } };
  if (DRY) {
    const n = await db.collection('goals').countDocuments({ 'members.userId': { $in: ids } });
    console.log(`  would strip these users from members[] on ${n} surviving goal(s)`);
  } else {
    const r = await db.collection('goals').updateMany({ 'members.userId': { $in: ids } }, pull);
    console.log(`  stripped from members[] on ${r.modifiedCount} surviving goal(s)`);
  }

  // In a dry run nothing has been removed yet, so the live count would report
  // the total unchanged and read as though the deletion had no effect.
  const remaining = await db.collection('users').countDocuments();
  console.log(`\n${DRY ? `would remain: ${remaining - ids.length}` : `remaining: ${remaining}`} user(s)`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
