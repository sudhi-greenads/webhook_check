const express = require('express');
const { 
  registerWebhook, 
  getAllWebhooks, 
  getWebhookById, 
  verifyWebhook, 
  getWebhookLogs, 
  clearWebhookLogs, 
  updateWebhook, 
  deleteWebhook,
  getWebhookOwner
} = require('../services/registryService');
const authMiddleware = require('../utils/authMiddleware');
const { apiRateLimiter } = require('../utils/rateLimiter');
const authKeyRouter = require('./authKeyRouter');

const router = express.Router();

// Apply api rate limiter
router.use(apiRateLimiter);

// Mount Auth Keys routes
router.use('/keys', authKeyRouter);

// Get all registered webhooks (paginated, with log counts and linked auth key)
router.get('/webhooks', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const webhooks = await getAllWebhooks(req.user.id, page, limit, search);
    res.json(webhooks);
  } catch (err) {
    console.error('Failed to fetch webhooks:', err);
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
    console.error('Failed to fetch webhook:', err);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// Register a new webhook (supports optional auth_key_id)
router.post('/webhooks/register', authMiddleware, async (req, res) => {
  let { name, key, auth_key_id } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  
  if (!key || !key.trim()) {
    key = 'api-' + Math.floor(100000000 + Math.random() * 900000000);
  }

  const authKeyId = auth_key_id ? parseInt(auth_key_id) : null;

  try {
    const result = await registerWebhook(req.user.id, name.trim(), key.trim(), authKeyId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ success: true, id: result.id, name: name.trim(), key: key.trim(), url: `/${name.trim()}/${key.trim()}` });
  } catch (err) {
    console.error('Failed to register webhook:', err);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// Update a webhook (supports updating name, key, and auth_key_id)
router.put('/webhooks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, key, auth_key_id } = req.body;
  
  if (!name || !name.trim() || !key || !key.trim()) {
    return res.status(400).json({ error: 'Name and key are required' });
  }

  const authKeyId = auth_key_id === null || auth_key_id === '' || auth_key_id === 0 ? null : parseInt(auth_key_id);
  
  try {
    const result = await updateWebhook(id, req.user.id, name.trim(), key.trim(), authKeyId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, webhook: result.webhook });
  } catch (err) {
    if (err.message && err.message.includes('unauthorized')) return res.status(403).json({ error: 'Forbidden' });
    console.error('Failed to update webhook:', err);
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
    console.error('Failed to delete webhook:', err);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get logs for a specific webhook with filtering & pagination
router.get('/log/:name/:key', authMiddleware, async (req, res) => {
  const { name, key } = req.params;
  const filters = req.query;

  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) return res.status(404).json({ error: 'Webhook not found' });
    
    // Ensure the current user owns this webhook
    const ownerId = await getWebhookOwner(webhookId);
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await getWebhookLogs(webhookId, filters, page, limit);
    res.json(logs);
  } catch (e) {
    console.error('Error reading logs:', e);
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
    const ownerId = await getWebhookOwner(webhookId);
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await clearWebhookLogs(webhookId);
    res.json({ success: true, message: 'Logs cleared' });
  } catch (err) {
    console.error('Error clearing log:', err);
    res.status(500).json({ error: 'Error clearing log' });
  }
});

module.exports = router;
