const express = require('express');
const { logger } = require('../logger');
const { streamLogs } = require('../utils/logHelper');
const { LOG_PATH } = require('../logger');

const router = express.Router();

// (logging middleware removed – loggerRouter now only serves log UI/API)

// EJS log page route removed

// Serve logs with optional search, pagination, sorting, and JSON output
router.get('/log', async (req, res) => {
  const { search = '', page = '1', limit = '1000', format = 'text', sort = 'desc' } = req.query;
  try {
    const logs = await streamLogs(LOG_PATH, {
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 1000,
      format,
      sort
    });
    if (logs.length === 0) return res.send('No logs yet.');
    if (format === 'json') return res.json(logs);
    res.type('text/plain').send(logs.join('\n'));
  } catch (e) {
    res.status(500).send('Error reading log');
  }
});

// Delete logs endpoint
router.delete('/log', (req, res) => {
  const fs = require('fs');
  fs.writeFile(LOG_PATH, '', err => {
    if (err) {
      res.status(500).send('Error clearing log');
    } else {
      res.send('Log cleared');
    }
  });
});

module.exports = router;
