const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Ambiguous glyphs are left out on purpose. People transcribe this code off a
// screen by hand, and 0/O and 1/I/L are where that goes wrong.
const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Compare codes by content, so spacing, dashes and case never decide a login. */
const normalizeRecoveryCode = (code) =>
  String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const preferencesSchema = new mongoose.Schema({
  notificationsEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  pushNotificationsEnabled: { type: Boolean, default: true },
  dailyReminderTime: { type: String, default: '09:00' },
  language: { type: String, default: 'en' }
}, { _id: false });

const resetTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { _id: false });

// Usernames are the only identity a new account has, so the rules are strict:
// lowercase a-z, digits and underscore. Case is folded on the way in so
// "Lalon" and "lalon" cannot both be taken — otherwise "unique" would only be
// unique to the database, not to a human reading it.
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username must be at most 20 characters'],
    match: [USERNAME_PATTERN, 'Username can only use letters, numbers and underscore']
  },
  // Optional since signup no longer collects any PII. Accounts created before
  // that change keep theirs, which is why this is `sparse` — a plain unique
  // index rejects the second document with no email at all.
  email: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  // With no email there is no reset link, so this is the only way back into an
  // account. Hashed like a password: a database dump must not be a skeleton key.
  recoveryCodeHash: {
    type: String,
    default: null,
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
    maxlength: [50, 'First name too long']
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    maxlength: [50, 'Last name too long']
  },
  profilePicture: { type: String, default: null },
  bio: { type: String, maxlength: [500, 'Bio too long'], default: '' },
  timezone: { type: String, default: 'UTC' },
  preferences: { type: preferencesSchema, default: () => ({}) },
  emailVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  refreshTokens: [{ type: String }],
  resetTokens: [resetTokenSchema]
}, {
  timestamps: true
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareRecoveryCode = async function (candidate) {
  if (!this.recoveryCodeHash) return false;
  return bcrypt.compare(normalizeRecoveryCode(candidate), this.recoveryCodeHash);
};

/**
 * What to show wherever a person's name used to go. Accounts made after the
 * PII-free signup have no name at all, so the username is the display name.
 */
userSchema.virtual('displayName').get(function () {
  const name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  return name || this.username;
});

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePicture: this.profilePicture,
    bio: this.bio,
    timezone: this.timezone,
    preferences: this.preferences,
    emailVerified: this.emailVerified,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

userSchema.statics.USERNAME_PATTERN = USERNAME_PATTERN;

/** Lowercase + trim, matching how the field itself is stored. */
userSchema.statics.normalizeUsername = (value) =>
  String(value || '').trim().toLowerCase();

userSchema.statics.isValidUsername = function (value) {
  return USERNAME_PATTERN.test(this.normalizeUsername(value));
};

/**
 * Turns arbitrary text into something the username rules accept, then walks
 * suffixes until it finds one nobody holds. Used by signup's suggestion and by
 * the backfill for accounts that predate usernames.
 *
 * `reserved` holds names handed out earlier in the same batch but not yet
 * written. Without it a caller generating several names in one pass can be
 * given the same name twice, since each check only sees what is already stored.
 */
userSchema.statics.generateUniqueUsername = async function (seed, reserved = new Set()) {
  const free = async (name) =>
    !reserved.has(name) && !(await this.exists({ username: name }));

  let base = this.normalizeUsername(seed).replace(/[^a-z0-9_]/g, '');
  if (base.length < 3) base = `user${base}`;
  base = base.slice(0, 16);

  if (await free(base)) return base;

  // Bounded rather than unbounded: after enough collisions a random tail is
  // faster than continuing to count, and avoids a slow scan on popular names.
  for (let n = 2; n <= 99; n += 1) {
    const candidate = `${base}${n}`;
    if (await free(candidate)) return candidate;
  }

  for (;;) {
    const tail = crypto.randomInt(1000, 999999);
    const candidate = `${base}${tail}`;
    if (await free(candidate)) return candidate;
  }
};

/** Formats as LI-XXXX-XXXX-XXXX; the dashes are cosmetic and ignored on compare. */
userSchema.statics.generateRecoveryCode = function () {
  const pick = () => RECOVERY_ALPHABET[crypto.randomInt(0, RECOVERY_ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join('');
  return `LI-${group()}-${group()}-${group()}`;
};

userSchema.statics.hashRecoveryCode = (code) =>
  bcrypt.hash(normalizeRecoveryCode(code), 12);

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
