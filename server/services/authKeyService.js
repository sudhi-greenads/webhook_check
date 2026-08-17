const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../db');

class AuthKeyService {
  /**
   * Validates an RSA PEM public key string.
   * @param {string} pemString 
   * @returns {{ valid: boolean, error?: string, keyObj?: crypto.KeyObject, keySize?: number, fingerprint?: string, normalizedPem?: string }}
   */
  validateRsaPublicKey(pemString) {
    if (!pemString || typeof pemString !== 'string') {
      return { valid: false, error: 'Public key must be a non-empty string' };
    }

    const trimmed = pemString.trim();
    if (!trimmed.includes('-----BEGIN PUBLIC KEY-----') && !trimmed.includes('-----BEGIN RSA PUBLIC KEY-----')) {
      return { valid: false, error: 'Key must be in valid PEM format with -----BEGIN PUBLIC KEY----- or -----BEGIN RSA PUBLIC KEY----- header' };
    }

    try {
      const keyObj = crypto.createPublicKey(trimmed);
      if (keyObj.asymmetricKeyType !== 'rsa') {
        return { valid: false, error: `Unsupported key algorithm: ${keyObj.asymmetricKeyType}. Only RSA is supported.` };
      }

      const keyDetails = keyObj.asymmetricKeyDetails;
      const keySize = keyDetails && keyDetails.modulusLength ? keyDetails.modulusLength : 2048;

      if (keySize < 2048) {
        return { valid: false, error: `RSA key size too short (${keySize} bits). Minimum requirement is 2048 bits for security.` };
      }

      const spkiDer = keyObj.export({ type: 'spki', format: 'der' });
      const fingerprint = 'SHA256:' + crypto.createHash('sha256').update(spkiDer).digest('base64').replace(/=+$/, '');
      const normalizedPem = keyObj.export({ type: 'spki', format: 'pem' });

      return {
        valid: true,
        keyObj,
        keySize,
        fingerprint,
        normalizedPem
      };
    } catch (err) {
      return { valid: false, error: `Invalid RSA public key: ${err.message}` };
    }
  }

  /**
   * Generates a new RSA 2048-bit key pair.
   * Public key is stored in database; Private key is returned ONCE to the user.
   */
  async generateKeyPair({ userId, name, validityDays = null, customExpiresAt = null }) {
    if (!name || !name.trim()) {
      throw new Error('Key name/label is required');
    }

    // 1. Generate RSA 2048 key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // 2. Compute fingerprint
    const keyObj = crypto.createPublicKey(publicKey);
    const spkiDer = keyObj.export({ type: 'spki', format: 'der' });
    const fingerprint = 'SHA256:' + crypto.createHash('sha256').update(spkiDer).digest('base64').replace(/=+$/, '');

    // 3. Compute expiration
    let expiresAt = null;
    if (customExpiresAt) {
      expiresAt = new Date(customExpiresAt);
    } else if (validityDays && parseInt(validityDays) > 0) {
      expiresAt = new Date(Date.now() + parseInt(validityDays) * 24 * 60 * 60 * 1000);
    }

    // 4. Save to DB
    const res = await pool.query(
      `INSERT INTO auth_keys (user_id, name, algorithm, public_key, key_fingerprint, key_size, expires_at)
       VALUES ($1, $2, 'RS256', $3, $4, 2048, $5)
       RETURNING id, name, algorithm, public_key, key_fingerprint, key_size, expires_at, created_at`,
      [userId, name.trim(), publicKey, fingerprint, expiresAt]
    );

    const createdKey = res.rows[0];

    return {
      success: true,
      key: {
        ...createdKey,
        private_key: privateKey // Returned ONCE to client
      }
    };
  }

  /**
   * Imports an existing user-provided RSA PEM public key.
   */
  async importPublicKey({ userId, name, publicKeyPem, validityDays = null, customExpiresAt = null }) {
    if (!name || !name.trim()) {
      throw new Error('Key name/label is required');
    }

    // 1. Validate PEM
    const validation = this.validateRsaPublicKey(publicKeyPem);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Compute expiration
    let expiresAt = null;
    if (customExpiresAt) {
      expiresAt = new Date(customExpiresAt);
    } else if (validityDays && parseInt(validityDays) > 0) {
      expiresAt = new Date(Date.now() + parseInt(validityDays) * 24 * 60 * 60 * 1000);
    }

    // 3. Save normalized public key to DB
    const res = await pool.query(
      `INSERT INTO auth_keys (user_id, name, algorithm, public_key, key_fingerprint, key_size, expires_at)
       VALUES ($1, $2, 'RS256', $3, $4, $5, $6)
       RETURNING id, name, algorithm, public_key, key_fingerprint, key_size, expires_at, created_at`,
      [userId, name.trim(), validation.normalizedPem, validation.fingerprint, validation.keySize, expiresAt]
    );

    return {
      success: true,
      key: res.rows[0]
    };
  }

  /**
   * Get all auth keys for a user with pagination and search.
   */
  async getUserKeys(userId, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT 
        ak.id,
        ak.name,
        ak.algorithm,
        ak.public_key,
        ak.key_fingerprint,
        ak.key_size,
        ak.expires_at,
        ak.last_used_at,
        ak.created_at,
        COUNT(w.id)::int AS webhook_count,
        COUNT(*) OVER() AS total_count
      FROM auth_keys ak
      LEFT JOIN webhooks w ON w.auth_key_id = ak.id
      WHERE ak.user_id = $1
    `;

    const params = [userId];
    let paramIdx = 2;

    if (search && search.trim()) {
      sql += ` AND (ak.name ILIKE $${paramIdx} OR ak.key_fingerprint ILIKE $${paramIdx})`;
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    sql += `
      GROUP BY ak.id
      ORDER BY ak.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);

    const res = await pool.query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
    const data = res.rows.map(row => {
      const { total_count, ...key } = row;
      return key;
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Fast dropdown list of active user keys for webhook create/edit with search and pagination/limits.
   */
  async getAllActiveUserKeys(userId, { search = '', limit = 50, page = 1 } = {}) {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT 
        id, 
        name, 
        algorithm, 
        key_fingerprint, 
        expires_at, 
        created_at,
        COUNT(*) OVER() AS total_count
      FROM auth_keys
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const params = [userId];
    let paramIdx = 2;

    if (search && search.trim()) {
      sql += ` AND (name ILIKE $${paramIdx} OR key_fingerprint ILIKE $${paramIdx})`;
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    sql += `
      ORDER BY name ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);

    const res = await pool.query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
    const data = res.rows.map(row => {
      const { total_count, ...key } = row;
      return key;
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get single key with its linked webhooks.
   */
  async getKeyById(keyId, userId) {
    const res = await pool.query(
      `SELECT id, name, algorithm, public_key, key_fingerprint, key_size, expires_at, last_used_at, created_at
       FROM auth_keys
       WHERE id = $1 AND user_id = $2`,
      [keyId, userId]
    );

    if (res.rows.length === 0) return null;
    const key = res.rows[0];

    // Fetch linked webhooks
    const whRes = await pool.query(
      `SELECT id, name, key, created_at FROM webhooks WHERE auth_key_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
      [keyId, userId]
    );
    key.webhooks = whRes.rows;

    return key;
  }

  /**
   * Delete an auth key.
   */
  async deleteKey(keyId, userId) {
    const res = await pool.query(
      `DELETE FROM auth_keys WHERE id = $1 AND user_id = $2 RETURNING id`,
      [keyId, userId]
    );
    return res.rows.length > 0;
  }

  /**
   * Verify an incoming JWT token against a stored Auth Key and optional target webhook ID.
   */
  verifyWebhookJwt(authKey, token, expectedWebhookId = null) {
    if (!authKey) {
      return { valid: false, error: 'Auth key configuration missing', code: 'KEY_NOT_FOUND' };
    }

    // Check key expiration
    if (authKey.expires_at && new Date() > new Date(authKey.expires_at)) {
      return { valid: false, error: 'Auth key has expired', code: 'KEY_EXPIRED' };
    }

    if (!token) {
      return { valid: false, error: 'Missing token', code: 'TOKEN_REQUIRED' };
    }

    try {
      const decoded = jwt.verify(token, authKey.public_key, {
        algorithms: ['RS256']
      });

      // If token specifies an issuer_id / webhook_id / sub, and target webhook ID is provided, verify match
      const tokenIssuerId = decoded.issuer_id ?? decoded.webhook_id ?? (decoded.sub && !isNaN(Number(decoded.sub)) ? Number(decoded.sub) : decoded.sub);
      if (expectedWebhookId !== null && expectedWebhookId !== undefined && tokenIssuerId !== undefined && tokenIssuerId !== null) {
        if (String(tokenIssuerId) !== String(expectedWebhookId)) {
          return {
            valid: false,
            error: `Token issuer_id (${tokenIssuerId}) does not match destination webhook ID (${expectedWebhookId})`,
            code: 'ISSUER_ID_MISMATCH'
          };
        }
      }

      return { valid: true, payload: decoded };
    } catch (err) {
      return { valid: false, error: `Invalid token signature: ${err.message}`, code: 'INVALID_SIGNATURE' };
    }
  }

  /**
   * Comprehensive token inspection and cryptographic verification for debugging/test tool.
   */
  async inspectAndVerifyToken(userId, keyId, rawToken) {
    if (!keyId) {
      throw new Error('Auth Key ID is required');
    }

    const keyRes = await pool.query(
      `SELECT id, name, algorithm, public_key, key_fingerprint, key_size, expires_at, last_used_at, created_at
       FROM auth_keys
       WHERE id = $1 AND user_id = $2`,
      [keyId, userId]
    );

    if (keyRes.rows.length === 0) {
      throw new Error('Auth Key not found or does not belong to your account');
    }

    const key = keyRes.rows[0];
    const isKeyExpired = key.expires_at ? new Date() > new Date(key.expires_at) : false;

    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return {
        valid: false,
        code: 'TOKEN_REQUIRED',
        error: 'Please provide a JWT token string to verify',
        key: {
          id: key.id,
          name: key.name,
          algorithm: key.algorithm,
          fingerprint: key.key_fingerprint,
          key_size: key.key_size,
          expires_at: key.expires_at,
          is_expired: isKeyExpired
        }
      };
    }

    // Clean Bearer prefix
    let token = rawToken.trim();
    if (token.startsWith('Bearer ')) {
      token = token.substring(7).trim();
    }

    // Decode unverified token for inspection
    let decoded = null;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (e) {
      // Decode error
    }

    if (!decoded || !decoded.header || !decoded.payload) {
      return {
        valid: false,
        code: 'MALFORMED_JWT',
        error: 'Invalid JWT structure. A valid JWT contains 3 parts separated by dots (header.payload.signature)',
        key: {
          id: key.id,
          name: key.name,
          algorithm: key.algorithm,
          fingerprint: key.key_fingerprint,
          key_size: key.key_size,
          expires_at: key.expires_at,
          is_expired: isKeyExpired
        }
      };
    }

    const header = decoded.header;
    const payload = decoded.payload;
    const nowSec = Math.floor(Date.now() / 1000);

    const isTokenExpired = payload.exp ? nowSec > payload.exp : false;
    const algorithmMatch = header.alg === 'RS256';

    // Diagnostics metadata
    let timeUntilExpiration = 'Never (No exp claim)';
    if (payload.exp) {
      const diffSec = payload.exp - nowSec;
      if (diffSec > 0) {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        timeUntilExpiration = mins > 0 ? `${mins}m ${secs}s remaining` : `${secs}s remaining`;
      } else {
        const absDiff = Math.abs(diffSec);
        const mins = Math.floor(absDiff / 60);
        timeUntilExpiration = mins > 0 ? `Expired ${mins}m ago` : `Expired ${absDiff}s ago`;
      }
    }

    const diagnostics = {
      algorithm_match: algorithmMatch,
      token_algorithm: header.alg || 'unknown',
      expected_algorithm: 'RS256',
      is_key_expired: isKeyExpired,
      is_token_expired: isTokenExpired,
      time_until_expiration: timeUntilExpiration,
      issued_at_readable: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Not specified',
      expires_at_readable: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Never (No exp claim)',
      issuer: payload.iss || 'Not specified',
      issuer_id: payload.issuer_id ?? payload.webhook_id ?? payload.sub ?? 'Not specified',
      audience: payload.aud || 'Not specified'
    };

    // Check key expiration first
    if (isKeyExpired) {
      return {
        valid: false,
        code: 'KEY_EXPIRED',
        error: `The Auth Key "${key.name}" has expired and can no longer be used for verification`,
        header,
        payload,
        key: {
          id: key.id,
          name: key.name,
          algorithm: key.algorithm,
          fingerprint: key.key_fingerprint,
          key_size: key.key_size,
          expires_at: key.expires_at,
          is_expired: isKeyExpired
        },
        diagnostics
      };
    }

    // Verify cryptographic signature
    try {
      jwt.verify(token, key.public_key, { algorithms: ['RS256'] });

      // Verification succeeded: update key last used timestamp
      this.updateKeyLastUsed(key.id);

      return {
        valid: true,
        code: 'VALID',
        error: null,
        header,
        payload,
        key: {
          id: key.id,
          name: key.name,
          algorithm: key.algorithm,
          fingerprint: key.key_fingerprint,
          key_size: key.key_size,
          expires_at: key.expires_at,
          is_expired: isKeyExpired
        },
        diagnostics
      };
    } catch (err) {
      let code = 'INVALID_SIGNATURE';
      let errorMsg = `Signature verification failed: ${err.message}`;

      if (err.name === 'TokenExpiredError') {
        code = 'TOKEN_EXPIRED';
        errorMsg = `Token has expired at ${diagnostics.expires_at_readable}`;
      } else if (err.message && err.message.includes('algorithm')) {
        code = 'ALGORITHM_MISMATCH';
        errorMsg = `Token algorithm mismatch: received "${header.alg}", expected "RS256"`;
      }

      return {
        valid: false,
        code,
        error: errorMsg,
        header,
        payload,
        key: {
          id: key.id,
          name: key.name,
          algorithm: key.algorithm,
          fingerprint: key.key_fingerprint,
          key_size: key.key_size,
          expires_at: key.expires_at,
          is_expired: isKeyExpired
        },
        diagnostics
      };
    }
  }

  /**
   * Update last used timestamp of a key.
   */
  async updateKeyLastUsed(keyId) {
    try {
      await pool.query(
        `UPDATE auth_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [keyId]
      );
    } catch (e) {
      // Non-critical background update
    }
  }
}

module.exports = new AuthKeyService();
