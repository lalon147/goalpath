const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
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
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    switch (level) {
      case 'error':
        console.error('\x1b[31m' + logMessage + '\x1b[0m'); // Red
        break;
      case 'warn':
        console.warn('\x1b[33m' + logMessage + '\x1b[0m'); // Yellow
        break;
      case 'info':
        console.log('\x1b[32m' + logMessage + '\x1b[0m'); // Green
        break;
      case 'debug':
        console.log('\x1b[36m' + logMessage + '\x1b[0m'); // Cyan
        break;
      default:
        console.log(logMessage);
    }
  }
  
  // Log to file
  const logFile = path.join(logsDir, `${level}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
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