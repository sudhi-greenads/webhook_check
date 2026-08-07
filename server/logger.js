// logger.js – central logger configuration
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const rfs = require('rotating-file-stream');


// Determine log directory – use env var or fallback to local "logs" folder
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Full path to the current log file
const LOG_PATH = process.env.LOG_PATH || path.join(LOG_DIR, 'logs.txt');

// Create pino logger that writes directly to file (uses internal SonicBoom with file descriptor)
const logger = pino(pino.destination({ dest: LOG_PATH, sync: false }));

module.exports = { logger, LOG_PATH };
