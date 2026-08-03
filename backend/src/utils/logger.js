const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist. File logging is a convenience on
// local machines; on hosts with a read-only or ephemeral filesystem we fall
// back to console-only rather than crashing at require time.
const logsDir = process.env.LOG_DIR || './logs';
let fileLoggingEnabled = true;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  fileLoggingEnabled = false;
  console.warn(`[logger] file logging disabled (${err.message})`);
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = logLevels[process.env.LOG_LEVEL || 'info'] || 2;

const log = (level, message, data = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${data}`;
  
  // Log to console. Hosted platforms (Render, Vercel, Docker) capture stdout
  // and stderr, so this must not be gated on NODE_ENV or startup failures
  // become invisible. Colour codes are only useful on a TTY.
  const colours = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[32m', debug: '\x1b[36m' };
  const useColour = Boolean(process.stdout.isTTY) && colours[level];
  const consoleMessage = useColour ? colours[level] + logMessage + '\x1b[0m' : logMessage;

  switch (level) {
    case 'error':
      console.error(consoleMessage);
      break;
    case 'warn':
      console.warn(consoleMessage);
      break;
    default:
      console.log(consoleMessage);
  }

  // Log to file
  if (fileLoggingEnabled) {
    try {
      const logFile = path.join(logsDir, `${level}.log`);
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (err) {
      fileLoggingEnabled = false;
      console.warn(`[logger] file logging disabled (${err.message})`);
    }
  }
};

module.exports = {
  error: (message, data) => {
    if (currentLogLevel >= logLevels.error) {
      log('error', message, data);
    }
  },
  warn: (message, data) => {
    if (currentLogLevel >= logLevels.warn) {
      log('warn', message, data);
    }
  },
  info: (message, data) => {
    if (currentLogLevel >= logLevels.info) {
      log('info', message, data);
    }
  },
  debug: (message, data) => {
    if (currentLogLevel >= logLevels.debug) {
      log('debug', message, data);
    }
  }
};