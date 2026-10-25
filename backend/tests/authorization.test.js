
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/server');
const User = require('../src/models/User');
const Goal = require('../src/models/Goal');

let userA, userB, tokenA, tokenB, goalId;

const signup = async (prefix) => {
  const username =
    prefix + Date.now().toString().slice(-9) +
    Math.floor(Math.random() * 1000);

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username, password: 'TestPass123' });

  expect(res.status).toBe(201);
  return res.body.data;
};

const asUser = (token) => ({
  Authorization: `Bearer ${token}`
});

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
  }

  const a = await signup('owner');
  const b = await signup('other');

  userA = a.user;
  userB = b.user;
  tokenA = a.tokens.accessToken;
  tokenB = b.tokens.accessToken;

  const res = await request(app)
    .post('/api/goals')
    .set(asUser(tokenA))
    .send({
      title: 'Private security test goal',
      category: 'learning',
      type: 'short-term',
      targetDate: new Date(
        Date.now() + 30 * 86400000
      ).toISOString()
    });

  expect(res.status).toBe(201);
  goalId = res.body.data._id;
}, 30000);

afterAll(async () => {
  // Only clean up records created by these tests.
  if (goalId) {
    await Goal.deleteOne({ _id: goalId });
  }

  for (const user of [userA, userB]) {
    if (user?.id) {
      await User.deleteOne({ _id: user.id });
    }
  }

  await mongoose.connection.close();
});

describe('Goal object-level authorisation', () => {

  test('AUTH-01: Owner can view their goal', async () => {
    const res = await request(app)
      .get(`/api/goals/${goalId}`)
      .set(asUser(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(goalId);
  });

  test('AUTH-02: Other user cannot view private goal', async () => {
    const res = await request(app)
      .get(`/api/goals/${goalId}`)
      .set(asUser(tokenB));

    expect(res.status).toBe(404);
  });

  test('AUTH-03: Other user cannot update goal', async () => {
    const res = await request(app)
      .put(`/api/goals/${goalId}`)
      .set(asUser(tokenB))
      .send({ title: 'Unauthorised change' });

    expect(res.status).toBe(404);
  });

  test('AUTH-04: Other user cannot delete goal', async () => {
    const res = await request(app)
      .delete(`/api/goals/${goalId}`)
      .set(asUser(tokenB));

    expect(res.status).toBe(404);
  });

  test('AUTH-05: Other user cannot list private goal', async () => {
    const res = await request(app)
      .get('/api/goals')
      .set(asUser(tokenB));

    expect(res.status).toBe(200);

    const ids = res.body.data.goals.map(
      goal => String(goal._id)
    );

    expect(ids).not.toContain(goalId);
  });

  test('AUTH-06: Owner can update their goal', async () => {
    const res = await request(app)
      .put(`/api/goals/${goalId}`)
      .set(asUser(tokenA))
      .send({ title: 'Updated by owner' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated by owner');
  });

  test('AUTH-07: Unauthorised changes did not delete the goal', async () => {
    const res = await request(app)
      .get(`/api/goals/${goalId}`)
      .set(asUser(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated by owner');
  });

});
