const express = require('express');
const authMiddleware = require('../utils/authMiddleware');
const authKeyService = require('../services/authKeyService');
const { apiRateLimiter } = require('../utils/rateLimiter');

const router = express.Router();

// Apply rate limiter and auth middleware to all key endpoints
router.use(apiRateLimiter);
router.use(authMiddleware);

// Get paginated list of auth keys
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await authKeyService.getUserKeys(req.user.id, page, limit, search);
    res.json(result);
  } catch (err) {
    console.error('Error fetching auth keys:', err);
    res.status(500).json({ error: 'Failed to fetch auth keys' });
  }
});

// Get simple active keys list (for dropdown selector with search and limit)
router.get('/active', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const result = await authKeyService.getAllActiveUserKeys(req.user.id, { page, limit, search });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching active keys:', err);
    res.status(500).json({ error: 'Failed to fetch active keys' });
  }
});

// Pre-validate a public key PEM string
router.post('/validate', (req, res) => {
  const { publicKeyPem } = req.body;
  const validation = authKeyService.validateRsaPublicKey(publicKeyPem);
  if (!validation.valid) {
    return res.status(400).json({ success: false, valid: false, error: validation.error });
  }
  res.json({
    success: true,
    valid: true,
    keySize: validation.keySize,
    fingerprint: validation.fingerprint
  });
});

// Interactive token verification & diagnostic tool (supports body and query params)
router.post('/verify-token', async (req, res) => {
  try {
    const keyId = req.body.keyId || req.query.keyId;
    const token = req.body.token || req.query.token;

    if (!keyId) {
      return res.status(400).json({ success: false, error: 'Auth key ID (keyId) is required' });
    }

    const result = await authKeyService.inspectAndVerifyToken(req.user.id, parseInt(keyId), token);
    res.json({ success: true, verification: result });
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to verify token' });
  }
});

// Auto-generate key pair (public key saved in DB, private key returned once)
router.post('/generate', async (req, res) => {
  try {
    const { name, validityDays, customExpiresAt } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const result = await authKeyService.generateKeyPair({
      userId: req.user.id,
      name,
      validityDays,
      customExpiresAt
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error generating key pair:', err);
    res.status(500).json({ error: err.message || 'Failed to generate key pair' });
  }
});

// Import user-provided public key
router.post('/import', async (req, res) => {
  try {
    const { name, publicKeyPem, validityDays, customExpiresAt } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Key name is required' });
    }
    if (!publicKeyPem || !publicKeyPem.trim()) {
      return res.status(400).json({ error: 'Public key (PEM) is required' });
    }

    const result = await authKeyService.importPublicKey({
      userId: req.user.id,
      name,
      publicKeyPem,
      validityDays,
      customExpiresAt
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error importing public key:', err);
    res.status(400).json({ error: err.message || 'Failed to import public key' });
  }
});

// Get single key with linked webhooks
router.get('/:id', async (req, res) => {
  try {
    const key = await authKeyService.getKeyById(parseInt(req.params.id), req.user.id);
    if (!key) {
      return res.status(404).json({ error: 'Auth key not found' });
    }
    res.json({ success: true, key });
  } catch (err) {
    console.error('Error fetching key details:', err);
    res.status(500).json({ error: 'Failed to fetch key details' });
  }
});

// Delete/revoke an auth key
router.delete('/:id', async (req, res) => {
  try {
    const success = await authKeyService.deleteKey(parseInt(req.params.id), req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Auth key not found or unauthorized' });
    }
    res.json({ success: true, message: 'Auth key deleted successfully' });
  } catch (err) {
    console.error('Error deleting auth key:', err);
    res.status(500).json({ error: 'Failed to delete auth key' });
  }
});

module.exports = router;
