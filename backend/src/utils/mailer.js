const logger = require('./logger');

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://goalpath-web.vercel.app';

/**
 * Delivers a password reset link.
 *
 * There is no email provider wired up yet. The token must not be logged: it is
 * the entire credential, so anyone who can read the server log — the Render
 * dashboard, any connected log drain — could reset the account it belongs to.
 * Keeping it off the HTTP response is necessary but was never sufficient.
 *
 * Outside production the link is printed so local development still works.
 * Swap the body of this function for a real send when SMTP or an API key
 * exists; nothing else in the flow has to change.
 */
exports.sendPasswordReset = async (email, token) => {
  const link = `${WEB_APP_URL}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === 'production') {
    // The address is enough to correlate with a support request; the token is
    // not recorded anywhere it could be read back.
    logger.info(`[password-reset] Reset link issued for ${email} (valid 1h)`);
    return { delivered: 'none', reason: 'no mail provider configured' };
  }

  logger.info(`[password-reset] Link for ${email} (valid 1h): ${link}`);
  return { delivered: 'log' };
};
