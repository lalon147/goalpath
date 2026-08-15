const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../src/server');
const User = require('../src/models/User');
const Habit = require('../src/models/Habit');

/**
 * The category field accepts three ways of saying "no category" — the field
 * omitted, an explicit null, and the empty string the web form sends when it is
 * cleared — because the request validator accepts all three. The schema used to
 * accept none of them, so creating a habit without picking a category failed.
 */

const PASSWORD = 'TestPass123';
const unique = (p) => `${p}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

let auth;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('connected', resolve));
  }
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ username: unique('habit'), password: PASSWORD });
  auth = res.body.data;
}, 30000);

afterAll(async () => {
  await Habit.deleteMany({ userId: auth.user.id });
  await User.deleteOne({ _id: auth.user.id });
  await mongoose.connection.close();
});

const createHabit = (body) =>
  request(app)
    .post('/api/habits')
    .set('Authorization', `Bearer ${auth.tokens.accessToken}`)
    .send({ title: 'Read for 20 minutes', frequency: 'daily', ...body });

describe('habit category', () => {
  it('creates a habit with no category field at all', async () => {
    const res = await createHabit({});
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBeNull();
  });

  it('creates a habit with an explicit null category', async () => {
    const res = await createHabit({ category: null });
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBeNull();
  });

  it('creates a habit with an empty-string category, storing it as null', async () => {
    const res = await createHabit({ category: '' });
    expect(res.status).toBe(201);
    // One empty state, not two: '' must not reach the database.
    expect(res.body.data.category).toBeNull();
  });

  it('creates a habit with a valid category', async () => {
    const res = await createHabit({ category: 'learning' });
    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe('learning');
  });

  it('still rejects a category outside the list', async () => {
    const res = await createHabit({ category: 'not-a-category' });
    expect(res.status).toBe(400);
  });

  it('clears a category on update', async () => {
    const created = await createHabit({ category: 'fitness' });
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/habits/${id}`)
      .set('Authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ category: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.category).toBeNull();
  });

  it('keeps the validator and the schema agreed on the category list', () => {
    const { createHabitSchema } = require('../src/validators/habitValidator');
    const allowed = createHabitSchema.describe().keys.category.allow;
    Habit.CATEGORIES.forEach((c) => expect(allowed).toContain(c));
  });
});
