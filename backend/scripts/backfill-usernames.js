/**
 * Gives every pre-existing account a username, and relaxes the email index.
 *
 * Signup stopped collecting email, so `email` is now optional. The unique index
 * Mongo already built is not sparse, and a non-sparse unique index treats a
 * missing field as the value `null` — so the *second* PII-free signup would
 * collide with the first and be rejected. Dropping and rebuilding it as sparse
 * is the only way to change that; index options cannot be altered in place.
 *
 * Safe to run more than once: users that already have a username are skipped,
 * and the index is only touched when its options are actually wrong.
 *
 *   node scripts/backfill-usernames.js          # apply
 *   node scripts/backfill-usernames.js --dry    # report only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const DRY = process.argv.includes('--dry');

const seedFor = (user) => {
  const name = `${user.firstName || ''}${user.lastName || ''}`.trim();
  if (name) return name;
  if (user.email) return String(user.email).split('@')[0];
  return 'user';
};

const fixEmailIndex = async () => {
  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  const emailIndex = indexes.find((i) => i.key && i.key.email === 1);

  if (!emailIndex) return 'absent — will be created as sparse on next boot';
  if (emailIndex.sparse) return 'already sparse';

  if (DRY) return `would drop and recreate "${emailIndex.name}" as sparse`;

  await collection.dropIndex(emailIndex.name);
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  return 'dropped and recreated as sparse';
};

/**
 * Created here rather than left to Mongoose's autoIndex at boot: production may
 * run with autoIndex off, and until this index exists the unique constraint is
 * only the controller's check-then-write — which two simultaneous signups can
 * both pass. Runs after the backfill so there are no missing values to reject.
 */
const ensureUsernameIndex = async () => {
  const collection = mongoose.connection.collection('users');
  const existing = (await collection.indexes()).find((i) => i.key && i.key.username === 1);

  if (existing?.unique) return 'already unique';
  if (DRY) return existing ? 'would recreate as unique' : 'would create as unique';

  if (existing) await collection.dropIndex(existing.name);
  await collection.createIndex({ username: 1 }, { unique: true });
  return existing ? 'recreated as unique' : 'created as unique';
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log(`connected${DRY ? ' (dry run — nothing will be written)' : ''}`);

  console.log(`email index: ${await fixEmailIndex()}`);

  // Reads the raw collection: documents without a username cannot be hydrated
  // through the model now that the field is required.
  const stale = await mongoose.connection
    .collection('users')
    .find(
      { $or: [{ username: { $exists: false } }, { username: null }, { username: '' }] },
      { projection: { firstName: 1, lastName: 1, email: 1 } }
    )
    .toArray();

  console.log(`${stale.length} account(s) need a username`);

  // Names already handed out in this pass. A dry run writes nothing, so without
  // this every duplicate seed would be told the same name is free.
  const reserved = new Set();

  let done = 0;
  for (const user of stale) {
    // Sequential, not Promise.all: generateUniqueUsername checks availability
    // before writing, so two concurrent calls with the same seed would both see
    // it free and pick the same name.
    const username = await User.generateUniqueUsername(seedFor(user), reserved);
    reserved.add(username);

    if (DRY) {
      console.log(`  ${user._id} -> ${username}`);
    } else {
      await mongoose.connection
        .collection('users')
        .updateOne({ _id: user._id }, { $set: { username } });
      console.log(`  ${user._id} -> ${username}`);
    }
    done += 1;
  }

  console.log(DRY ? `would update ${done}` : `updated ${done}`);

  // Last, so it is only applied once every document has a username to index.
  console.log(`username index: ${await ensureUsernameIndex()}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
