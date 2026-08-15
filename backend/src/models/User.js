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
  // SHA-256 hashes, not the tokens themselves — same reasoning as resetTokens.
  // A database dump must not hand over 30 days of live sessions for every user.
  // Entries written before this change are raw JWTs; the refresh flow accepts
  // either so existing sessions survive, and rewrites them as hashes on use.
  refreshTokens: [{ type: String }],
  resetTokens: [resetTokenSchema],

  // Rate limiting is per-IP and resets when the instance restarts, which on a
  // free tier is often. These two survive both, so throttling a password guesser
  // does not depend on them keeping the same address or the process staying up.
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockedUntil: { type: Date, default: null, select: false }
}, {
  timestamps: true
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ status: 1 });

// Configurable, with a floor. BCRYPT_ROUNDS was set in the environment but
// never read, so raising it there silently did nothing; anything below 12 is
// ignored rather than honoured, so the setting cannot be used to weaken hashing.
const BCRYPT_ROUNDS = Math.max(12, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
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
  bcrypt.hash(normalizeRecoveryCode(code), BCRYPT_ROUNDS);

/**
 * Refresh tokens are stored as a digest of the token, never the token itself.
 *
 * SHA-256 rather than bcrypt here, unlike passwords: the input is already
 * high-entropy random data from jwt.sign, so there is nothing to brute-force
 * and no reason to pay bcrypt's cost on every refresh. This mirrors how
 * resetTokens are handled in the auth controller.
 */
userSchema.statics.hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

/** How many wrong passwords in a row before the account stops answering. */
userSchema.statics.MAX_LOGIN_ATTEMPTS = 10;
/** How long it stays shut after that. */
userSchema.statics.LOCK_DURATION_MS = 15 * 60 * 1000;

userSchema.methods.isLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
