const express = require('express');
const { verifyWebhook, logWebhookEvent } = require('../services/registryService');
const geoIpService = require('../services/geoIpService');
const { getClientIp, getFlowIps } = require('../utils/ipUtil');
const router = express.Router();

router.all('/:name/:key', async (req, res) => {
  const { name, key } = req.params;
  
  try {
    const webhookId = await verifyWebhook(name, key);
    if (!webhookId) {
      return res.status(404).json({ error: 'Webhook not registered' });
    }

    // Extract client IP and flow IPs
    const ip = getClientIp(req);
    const flow_ips = getFlowIps(req);

    // Non-blocking location lookup
    let location = null;
    try {
      location = await geoIpService.lookupIp(ip);
    } catch (e) {
      // Ignore error
    }

    // Log the request payload and network metadata to PostgreSQL
    await logWebhookEvent(
      webhookId,
      req.method,
      req.originalUrl,
      req.headers,
      req.query,
      req.body,
      ip,
      flow_ips,
      location
    );

    res.send('ok');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
