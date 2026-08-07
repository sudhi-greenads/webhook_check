const express = require('express');
const { 
  registerWebhook, 
  getAllWebhooks, 
  verifyWebhook,
  getWebhookLogs,
  clearWebhookLogs 
} = require('../services/registryService');

const router = express.Router();

// Get all registered webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await getAllWebhooks();
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Register a new webhook
router.post('/webhooks/register', async (req, res) => {
  let { name, key } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  if (!key) {
    key = 'api-' + Math.floor(100000000 + Math.random() * 900000000);
  }

  try {
    await registerWebhook(name, key);
    res.json({ success: true, name, key, url: `/${name}/${key}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// Get logs for a specific webhook with filtering
router.get('/log/:name/:key', async (req, res) => {
  const { name, key } = req.params;
  const filters = req.query;

  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) return res.status(404).json({ error: 'Webhook not registered' });

    const logs = await getWebhookLogs(webhookId, filters);
    res.json(logs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error reading logs' });
  }
});

// Clear logs for a specific webhook
router.delete('/log/:name/:key', async (req, res) => {
  const { name, key } = req.params;
  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) return res.status(404).json({ error: 'Webhook not registered' });

    await clearWebhookLogs(webhookId);
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error clearing log' });
  }
});

module.exports = router;
