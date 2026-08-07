const { cleanupOldDatabaseLogs } = require('../services/registryService');

function cleanupOldLogs() {
  cleanupOldDatabaseLogs(30)
    .then(() => console.log('Successfully cleaned up database logs older than 30 days.'))
    .catch(e => console.error('Failed to clean old logs from database:', e));
}

module.exports = { cleanupOldLogs };
