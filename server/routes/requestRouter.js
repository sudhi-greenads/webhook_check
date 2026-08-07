const express = require('express');
const { verifyWebhook, logWebhookEvent } = require('../services/registryService');
const router = express.Router();

router.all('/:name/:key', async (req, res) => {
  const { name, key } = req.params;
  
  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) {
      return res.status(404).json({ error: 'Webhook not registered' });
    }

    // Log the request payload to SQLite
    await logWebhookEvent(
      webhookId,
      req.method,
      req.originalUrl,
      req.headers,
      req.query,
      req.body
    );

    res.send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
