const logger = require('./logger');

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://goalpath-web.vercel.app';

/**
 * Delivers a password reset link.
 *
 * There is no email provider wired up yet, so the link is written to the
 * server log instead. That keeps the token off the HTTP response — returning
 * it to the caller would let anyone reset any account just by knowing the
 * address. Swap the body of this function for a real send when SMTP or an
 * API key exists; nothing else in the flow has to change.
 */
exports.sendPasswordReset = async (email, token) => {
  const link = `${WEB_APP_URL}/reset-password?token=${token}`;

  logger.info(
    `[password-reset] Link for ${email} (valid 1h): ${link}`
  );

  return { delivered: 'log' };
};
