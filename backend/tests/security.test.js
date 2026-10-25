
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../src/server');
const User = require('../src/models/User');
const Habit = require('../src/models/Habit');

let testUser;
let accessToken;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
  }

  const username = `sec${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 1000)}`;
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      username,
      password: 'TestPass123'
    });



  expect(res.status).toBe(201);
  expect(res.body.data.tokens.accessToken).toBeTruthy();

  testUser = res.body.data.user;
  accessToken = res.body.data.tokens.accessToken;
}, 30000);

afterAll(async () => {
  if (testUser) {
    await Habit.deleteMany({ userId: testUser.id });
    await User.deleteOne({ _id: testUser.id });
  }
  await mongoose.connection.close();
});

describe('JWT authentication security', () => {

  test('SEC-01: Reject request without token', async () => {
    const res = await request(app)
      .post('/api/habits')
      .send({ title: 'Security test', frequency: 'daily' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  test('SEC-02: Reject invalid JWT', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({ title: 'Security test', frequency: 'daily' });

    expect(res.status).toBe(401);
  });

  test('SEC-03: Reject expired JWT', async () => {
    const expired = jwt.sign(
      { id: testUser.id },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: -10 }
    );

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${expired}`)
      .send({ title: 'Security test', frequency: 'daily' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Token expired');
  });

  test('SEC-04: Reject JWT with incorrect signature', async () => {
    const fake = jwt.sign(
      { id: testUser.id },
      'an-incorrect-secret-used-for-testing-only',
      { algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${fake}`)
      .send({ title: 'Security test', frequency: 'daily' });

    expect(res.status).toBe(401);
  });

  test('SEC-05: Accept valid JWT', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Security test',
        frequency: 'daily'
      });

    expect(res.status).toBe(201);
  });

  test('SEC-06: Reject token for nonexistent user', async () => {
    const nonexistentId = new mongoose.Types.ObjectId().toString();

    const token = jwt.sign(
      { id: nonexistentId },
      process.env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Security test', frequency: 'daily' });

    expect(res.status).toBe(401);
  });

});
