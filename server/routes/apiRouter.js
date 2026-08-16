const express = require('express');
const { 
  registerWebhook, 
  getAllWebhooks, 
  getWebhookById,
  verifyWebhook,
  getWebhookLogs,
  clearWebhookLogs,
  updateWebhook,
  deleteWebhook
} = require('../services/registryService');
const authMiddleware = require('../utils/authMiddleware');
const { apiRateLimiter } = require('../utils/rateLimiter');

const router = express.Router();

// Apply api rate limiter
router.use(apiRateLimiter);

// Get all registered webhooks (paginated, with log counts)
router.get('/webhooks', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const webhooks = await getAllWebhooks(req.user.id, page, limit);
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Get a single webhook by ID (for edit page)
router.get('/webhooks/:id', authMiddleware, async (req, res) => {
  try {
    const webhook = await getWebhookById(req.params.id, req.user.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json({ success: true, webhook });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// Register a new webhook
router.post('/webhooks/register', authMiddleware, async (req, res) => {
  let { name, key } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  if (!key) {
    key = 'api-' + Math.floor(100000000 + Math.random() * 900000000);
  }

  try {
    await registerWebhook(req.user.id, name, key);
    res.json({ success: true, name, key, url: `/${name}/${key}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// Update a webhook
router.put('/webhooks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, key } = req.body;
  
  if (!name || !key) return res.status(400).json({ error: 'Name and key are required' });
  
  try {
    const result = await updateWebhook(id, req.user.id, name, key);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, webhook: result.webhook });
  } catch (err) {
    if (err.message && err.message.includes('unauthorized')) return res.status(403).json({ error: 'Forbidden' });
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete a webhook
router.delete('/webhooks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await deleteWebhook(id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Webhook not found or unauthorized' });
    }
    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get logs for a specific webhook with filtering
router.get('/log/:name/:key', authMiddleware, async (req, res) => {
  const { name, key } = req.params;
  const filters = req.query;

  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) return res.status(404).json({ error: 'Webhook not found' });
    
    // Ensure the current user owns this webhook
    const ownerId = await require('../services/registryService').getWebhookOwner(webhookId);
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await getWebhookLogs(webhookId, filters, page, limit);
    res.json(logs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error reading logs' });
  }
});

// Clear logs for a specific webhook
router.delete('/log/:name/:key', authMiddleware, async (req, res) => {
  const { name, key } = req.params;
  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) return res.status(404).json({ error: 'Webhook not found' });

    // Ensure the current user owns this webhook
    const ownerId = await require('../services/registryService').getWebhookOwner(webhookId);
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await clearWebhookLogs(webhookId);
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error clearing log' });
  }
});

module.exports = router;
