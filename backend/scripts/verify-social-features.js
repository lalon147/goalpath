/**
 * End-to-end check of the username auth, friends and shared-goal features.
 *
 * Boots the real Express app and drives it over HTTP against an isolated
 * database on the same cluster, then drops that database. It refuses to run if
 * the connection does not land on that isolated name, so production data is
 * never touched.
 *
 *   npm run verify:social
 */
require('dotenv').config();
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const VERIFY_DB = 'goalpath_e2e';

const u = new URL(process.env.MONGODB_URI);
u.pathname = `/${VERIFY_DB}`;
process.env.MONGODB_URI = u.toString();

let pass = 0, fail = 0;
const ok = (l) => { pass++; console.log(`  PASS  ${l}`); };
const bad = (l, d) => { fail++; console.log(`  FAIL  ${l}${d ? ` — ${d}` : ''}`); };

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.db.databaseName !== VERIFY_DB) throw new Error('wrong db');
  await mongoose.connection.dropDatabase();
  await require('../src/models/User').syncIndexes();

  // server.js listens on require, so the port is chosen before loading it
  // rather than by calling listen() a second time here.
  const PORT = 4599;
  process.env.PORT = String(PORT);
  require('../src/server');
  const base = `http://127.0.0.1:${PORT}/api`;
  // Give the listener a moment to bind before the first request.
  await new Promise((r) => setTimeout(r, 600));

  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, body: json };
  };

  console.log('signup (username only, no PII)');
  const a = await call('POST', '/auth/signup', { body: { username: 'alice', password: 'Password1' } });
  a.status === 201 ? ok('creates an account') : bad('signup', JSON.stringify(a.body));
  a.body?.data?.recoveryCode?.startsWith('GP-') ? ok('returns a one-time recovery code') : bad('recovery code missing');
  !a.body?.data?.user?.email ? ok('no email stored') : bad('email leaked');
  const aliceTok = a.body.data.tokens.accessToken;
  const aliceCode = a.body.data.recoveryCode;

  const dup = await call('POST', '/auth/signup', { body: { username: 'ALICE', password: 'Password1' } });
  dup.status === 409 ? ok('duplicate username rejected (case-insensitive)') : bad('duplicate', dup.status);
  dup.body?.error?.details?.suggestion ? ok(`offers a free alternative (${dup.body.error.details.suggestion})`) : bad('no suggestion');

  const badName = await call('POST', '/auth/signup', { body: { username: 'a b!', password: 'Password1' } });
  badName.status === 400 ? ok('invalid username rejected') : bad('charset', badName.status);

  console.log('\nusername availability');
  const taken = await call('GET', '/auth/username-available?username=alice');
  taken.body?.data?.available === false ? ok('reports a taken name') : bad('availability taken');
  const free = await call('GET', '/auth/username-available?username=zzz_free');
  free.body?.data?.available === true ? ok('reports a free name') : bad('availability free');

  console.log('\nsignin');
  const si = await call('POST', '/auth/signin', { body: { username: 'AlIcE', password: 'Password1' } });
  si.status === 200 ? ok('signs in by username, any case') : bad('signin', si.status);
  const wrong = await call('POST', '/auth/signin', { body: { username: 'alice', password: 'Nope1234' } });
  wrong.status === 401 ? ok('wrong password rejected') : bad('bad password', wrong.status);

  console.log('\nrecovery code');
  const badCode = await call('POST', '/auth/recover', {
    body: { username: 'alice', recoveryCode: 'GP-0000-0000-0000', newPassword: 'Newpass12' },
  });
  badCode.status === 400 ? ok('wrong recovery code rejected') : bad('bad code', badCode.status);

  const rec = await call('POST', '/auth/recover', {
    body: { username: 'alice', recoveryCode: aliceCode.toLowerCase(), newPassword: 'Newpass12' },
  });
  rec.status === 200 ? ok('correct code resets the password (case-insensitive)') : bad('recover', JSON.stringify(rec.body));
  rec.body?.data?.recoveryCode && rec.body.data.recoveryCode !== aliceCode
    ? ok('issues a fresh code, retiring the old one') : bad('code not rotated');

  const replay = await call('POST', '/auth/recover', {
    body: { username: 'alice', recoveryCode: aliceCode, newPassword: 'Another12' },
  });
  replay.status === 400 ? ok('spent code cannot be replayed') : bad('replay allowed', replay.status);

  const newSi = await call('POST', '/auth/signin', { body: { username: 'alice', password: 'Newpass12' } });
  newSi.status === 200 ? ok('new password works') : bad('new password', newSi.status);
  const aTok = newSi.body.data.tokens.accessToken;

  console.log('\nfriends');
  const b = await call('POST', '/auth/signup', { body: { username: 'bob', password: 'Password1' } });
  const bTok = b.body.data.tokens.accessToken;
  const c = await call('POST', '/auth/signup', { body: { username: 'carol', password: 'Password1' } });
  const cTok = c.body.data.tokens.accessToken;

  const search = await call('GET', '/friends/search?q=bo', { token: aTok });
  search.body?.data?.[0]?.username === 'bob' ? ok('search finds a user by username') : bad('search', JSON.stringify(search.body));
  search.body.data[0].email === undefined ? ok('search never returns an email') : bad('email exposed in search');

  const atSearch = await call('GET', '/friends/search?q=@bob', { token: aTok });
  atSearch.body?.data?.[0]?.username === 'bob' ? ok('a leading @ is accepted') : bad('@ handling');

  const req = await call('POST', '/friends/requests', { token: aTok, body: { username: 'bob' } });
  req.status === 201 ? ok('sends a request by username alone') : bad('send request', JSON.stringify(req.body));
  const fid = req.body.data.friendshipId;

  const self = await call('POST', '/friends/requests', { token: aTok, body: { username: 'alice' } });
  self.status === 400 ? ok('cannot add yourself') : bad('self-add', self.status);

  const dupReq = await call('POST', '/friends/requests', { token: aTok, body: { username: 'bob' } });
  dupReq.status === 409 ? ok('duplicate request rejected') : bad('dup request', dupReq.status);

  const steal = await call('POST', `/friends/requests/${fid}/accept`, { token: cTok });
  steal.status === 403 ? ok('a third party cannot accept someone else’s request') : bad('accept authz', steal.status);

  const selfAccept = await call('POST', `/friends/requests/${fid}/accept`, { token: aTok });
  selfAccept.status === 403 ? ok('the sender cannot accept their own request') : bad('sender accept', selfAccept.status);

  const acc = await call('POST', `/friends/requests/${fid}/accept`, { token: bTok });
  acc.status === 200 ? ok('the recipient can accept') : bad('accept', acc.status);

  const list = await call('GET', '/friends', { token: aTok });
  list.body?.data?.[0]?.username === 'bob' ? ok('friend appears in the list') : bad('friend list');

  console.log('\nshared goals');
  const goal = await call('POST', '/goals', {
    token: aTok,
    body: { title: 'Run a 10k', category: 'health', type: 'short-term', targetDate: '2027-01-01' },
  });
  const gid = goal.body.data._id;
  const m1 = await call('POST', `/goals/${gid}/milestones`, { token: aTok, body: { title: 'Week 1' } });
  const m2 = await call('POST', `/goals/${gid}/milestones`, { token: aTok, body: { title: 'Week 2' } });
  const mid1 = m1.body.data._id;

  const strangerInvite = await call('POST', `/goals/${gid}/members`, { token: aTok, body: { username: 'carol' } });
  strangerInvite.status === 403 ? ok('cannot invite a non-friend') : bad('friend-gate', strangerInvite.status);

  const inv = await call('POST', `/goals/${gid}/members`, { token: aTok, body: { username: 'bob' } });
  inv.status === 201 ? ok('invites a friend to a goal') : bad('invite', JSON.stringify(inv.body));

  const beforeJoin = await call('GET', '/goals', { token: bTok });
  (beforeJoin.body.data.goals || beforeJoin.body.data).length === 0
    ? ok('an unanswered invite is NOT in your goals list') : bad('invite leaked into goals');

  const pend = await call('GET', '/goals/invitations/pending', { token: bTok });
  pend.body?.data?.[0]?.owner?.username === 'alice' ? ok('invite is listed separately with its owner') : bad('pending list');

  const notMine = await call('GET', `/goals/${gid}`, { token: cTok });
  notMine.status === 404 ? ok('an outsider cannot read the goal') : bad('goal authz', notMine.status);

  await call('POST', `/goals/${gid}/members/respond`, { token: bTok, body: { accept: true } });
  const afterJoin = await call('GET', '/goals', { token: bTok });
  (afterJoin.body.data.goals || afterJoin.body.data).length === 1
    ? ok('accepting adds it to your goals') : bad('join');

  console.log('\nseparate progress');
  const bTick = await call('POST', `/goals/${gid}/milestones/${mid1}/complete`, { token: bTok });
  bTick.status === 200 ? ok('a member can tick a milestone') : bad('member tick', JSON.stringify(bTick.body));

  const bView = await call('GET', `/goals/${gid}`, { token: bTok });
  bView.body.data.myProgress.percentage === 50 ? ok('member sees their own 50%') : bad('member progress', bView.body.data.myProgress.percentage);

  const aView = await call('GET', `/goals/${gid}`, { token: aTok });
  aView.body.data.myProgress.percentage === 0 ? ok("owner is still 0% — progress is separate") : bad('progress leaked', aView.body.data.myProgress.percentage);

  const untick = await call('DELETE', `/goals/${gid}/milestones/${mid1}/complete`, { token: bTok });
  untick.status === 200 ? ok('a tick can be undone') : bad('untick', untick.status);
  const bView2 = await call('GET', `/goals/${gid}`, { token: bTok });
  bView2.body.data.myProgress.percentage === 0 ? ok('undoing restores 0%') : bad('untick effect');

  console.log('\nshared progress');
  await call('PUT', `/goals/${gid}`, { token: aTok, body: { progressMode: 'shared' } });
  const memberModeChange = await call('PUT', `/goals/${gid}`, { token: bTok, body: { progressMode: 'separate' } });
  memberModeChange.status === 404 ? ok('a member cannot change the mode') : bad('mode authz', memberModeChange.status);

  await call('POST', `/goals/${gid}/milestones/${mid1}/complete`, { token: bTok });
  const aShared = await call('GET', `/goals/${gid}`, { token: aTok });
  const bShared = await call('GET', `/goals/${gid}`, { token: bTok });
  (aShared.body.data.myProgress.percentage === 50 && bShared.body.data.myProgress.percentage === 50)
    ? ok("one member's tick counts for everyone") : bad('shared mode', `${aShared.body.data.myProgress.percentage}/${bShared.body.data.myProgress.percentage}`);

  const board = await call('GET', `/goals/${gid}/leaderboard`, { token: aTok });
  board.body?.data?.members?.length === 2 ? ok('leaderboard lists both participants') : bad('leaderboard');
  board.body.data.members.every((m) => m.username) ? ok('leaderboard rows carry usernames') : bad('leaderboard usernames');

  const boardOutsider = await call('GET', `/goals/${gid}/leaderboard`, { token: cTok });
  boardOutsider.status === 403 ? ok('an outsider cannot read the leaderboard') : bad('leaderboard authz', boardOutsider.status);

  console.log('\nweekly habit logging');
  const habit = await call('POST', '/habits', {
    token: aTok,
    body: { title: 'Read every day', frequency: 'daily', category: 'learning', targetValue: 10, unit: 'pages' },
  });
  habit.status === 201 ? ok('creates a habit') : bad('habit create', JSON.stringify(habit.body));
  const hid = habit.body.data._id;

  const wk = await call('GET', '/habits/logs/week', { token: aTok });
  wk.status === 200 ? ok('week endpoint responds') : bad('week', wk.status);
  wk.body?.data?.days?.length === 7 ? ok('returns seven days') : bad('days');
  new Date(`${wk.body.data.weekStart}T00:00:00`).getDay() === 1
    ? ok('week starts on Monday') : bad('week start day');
  wk.body.data.habits.length === 1 ? ok('lists the habit as a row') : bad('habit row');
  wk.body.data.habits[0].cells.length === 7 ? ok('row has a cell per day') : bad('cells');

  const futureDays = wk.body.data.days.filter((d) => d.isFuture).length;
  const dueSoFar = wk.body.data.habits[0].dueSoFar;
  dueSoFar === 7 - futureDays ? ok('only days already reached count as due') : bad('dueSoFar', dueSoFar);

  const today = wk.body.data.days.find((d) => d.isToday).date;
  const set1 = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: aTok, body: { date: today, status: 'completed' },
  });
  set1.status === 200 ? ok('logs a day') : bad('set day', JSON.stringify(set1.body));
  set1.body.data.currentStreak === 1 ? ok('streak updates') : bad('streak', set1.body.data.currentStreak);

  const set2 = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: aTok, body: { date: today, status: 'completed' },
  });
  set2.status === 200 ? ok('logging the same day twice is idempotent (no 409)') : bad('idempotent', set2.status);

  const changed = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: aTok, body: { date: today, status: 'skipped' },
  });
  changed.status === 200 && changed.body.data.currentStreak === 0
    ? ok('changing a day to skipped drops the streak') : bad('change day');

  const cleared = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: aTok, body: { date: today, status: null },
  });
  cleared.status === 200 ? ok('a day can be cleared') : bad('clear', cleared.status);
  const afterClear = await call('GET', '/habits/logs/week', { token: aTok });
  afterClear.body.data.habits[0].cells.find((c) => c.date === today).status === null
    ? ok('cleared day reads back empty') : bad('clear effect');

  // Backfill a past day inside this week, if the week has one.
  const past = wk.body.data.days.find((d) => !d.isFuture && !d.isToday);
  if (past) {
    const back = await call('PUT', `/habits/${hid}/logs/by-date`, {
      token: aTok, body: { date: past.date, status: 'completed' },
    });
    back.status === 200 ? ok('a missed past day can be backfilled') : bad('backfill', back.status);
  } else {
    ok('backfill skipped — today is the first day of the week');
  }

  const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const fut = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: aTok, body: { date: future, status: 'completed' },
  });
  fut.status === 400 ? ok('a future day cannot be logged') : bad('future day', fut.status);

  const otherHabit = await call('PUT', `/habits/${hid}/logs/by-date`, {
    token: bTok, body: { date: today, status: 'completed' },
  });
  otherHabit.status === 404 ? ok("cannot log someone else's habit") : bad('log authz', otherHabit.status);

  const summary = (await call('GET', '/habits/logs/week', { token: aTok })).body.data.summary;
  typeof summary.percentage === 'number' && typeof summary.perfectDays === 'number'
    ? ok('summary reports consistency and perfect days') : bad('summary');

  console.log('\nmilestone edit authority');
  const memberEdit = await call('POST', `/goals/${gid}/milestones`, { token: bTok, body: { title: 'Sneaky' } });
  memberEdit.status === 404 ? ok('a member cannot add milestones') : bad('milestone authz', memberEdit.status);

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
};

run().catch(async (e) => {
  console.error('\nERROR:', e.stack);
  try { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } catch {}
  process.exit(1);
});
