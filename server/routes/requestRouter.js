const express = require('express');
const { getWebhookWithAuth, logWebhookEvent } = require('../services/registryService');
const authKeyService = require('../services/authKeyService');
const geoIpService = require('../services/geoIpService');
const { getClientIp, getFlowIps } = require('../utils/ipUtil');
const router = express.Router();

router.all('/:name/:key', async (req, res) => {
  const { name, key } = req.params;
  
  try {
    const webhook = await getWebhookWithAuth(name, key);
    if (!webhook) {
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

    // Check if webhook is secured with an Auth Key
    if (webhook.auth_key_id) {
      // Extract Bearer token from Authorization header or X-Webhook-Token
      let token = null;
      const authHeader = req.headers['authorization'] || req.headers['x-webhook-token'];
      
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        } else {
          token = authHeader.trim();
        }
      }

      if (!token) {
        const errorResponse = { error: 'Missing Authorization header (Bearer token required)', code: 'AUTH_REQUIRED' };
        
        await logWebhookEvent(
          webhook.id,
          req.method,
          req.originalUrl,
          req.headers,
          req.query,
          req.body,
          ip,
          flow_ips,
          location,
          'failed',
          401,
          errorResponse
        );

        return res.status(401).json(errorResponse);
      }

      const authKeyObj = {
        id: webhook.auth_key_id,
        name: webhook.auth_key_name,
        algorithm: webhook.auth_key_algorithm,
        public_key: webhook.auth_key_public_key,
        expires_at: webhook.auth_key_expires_at,
        key_fingerprint: webhook.auth_key_fingerprint
      };

      const verification = authKeyService.verifyWebhookJwt(authKeyObj, token);

      if (!verification.valid) {
        const errorResponse = { error: verification.error, code: verification.code };
        
        await logWebhookEvent(
          webhook.id,
          req.method,
          req.originalUrl,
          req.headers,
          req.query,
          req.body,
          ip,
          flow_ips,
          location,
          'failed',
          401,
          errorResponse
        );

        return res.status(401).json(errorResponse);
      }

      // Verification succeeded: update key last used timestamp asynchronously
      authKeyService.updateKeyLastUsed(webhook.auth_key_id);

      // Log verified event
      await logWebhookEvent(
        webhook.id,
        req.method,
        req.originalUrl,
        req.headers,
        req.query,
        req.body,
        ip,
        flow_ips,
        location,
        'verified',
        200,
        'ok'
      );

      return res.send('ok');
    }

    // Public webhook (No auth required)
    await logWebhookEvent(
      webhook.id,
      req.method,
      req.originalUrl,
      req.headers,
      req.query,
      req.body,
      ip,
      flow_ips,
      location,
      'none',
      200,
      'ok'
    );

    res.send('ok');
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
