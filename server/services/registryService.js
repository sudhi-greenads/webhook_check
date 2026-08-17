const pool = require('../db');

// Initialize database schema
async function initializeDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_id VARCHAR(255) NOT NULL,
        access_token_id VARCHAR(255) NOT NULL,
        user_agent TEXT,
        ip VARCHAR(100),
        flow_ips TEXT,
        location JSONB,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        algorithm VARCHAR(50) DEFAULT 'RS256',
        public_key TEXT NOT NULL,
        key_fingerprint VARCHAR(100),
        key_size INTEGER DEFAULT 2048,
        expires_at TIMESTAMP NULL,
        last_used_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        auth_key_id INTEGER REFERENCES auth_keys(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, key)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER NOT NULL,
        method VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        headers JSONB NOT NULL,
        query JSONB NOT NULL,
        body JSONB NOT NULL,
        ip VARCHAR(100),
        flow_ips TEXT,
        location JSONB,
        auth_status VARCHAR(50) DEFAULT 'none',
        response_status INTEGER DEFAULT 200,
        response_body TEXT DEFAULT 'ok',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist on already-created databases
    await client.query(`
      ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS auth_key_id INTEGER REFERENCES auth_keys(id) ON DELETE SET NULL;
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS auth_status VARCHAR(50) DEFAULT 'none';
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS response_status INTEGER DEFAULT 200;
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS response_body TEXT DEFAULT 'ok';
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS ip VARCHAR(100);
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS flow_ips TEXT;
      ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS location JSONB;
    `);

    console.log("PostgreSQL Database initialized with Auth, Webhook, Auth Keys & GeoIP schema.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL:", err);
  } finally {
    client.release();
  }
}

// User Methods
async function createUser(username, passwordHash) {
  try {
    const res = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, passwordHash]
    );
    return { success: true, user: res.rows[0] };
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return { success: false, error: 'Username already exists' };
    }
    throw err;
  }
}

async function getUserByUsername(username) {
  const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

// Webhook Methods
async function registerWebhook(userId, name, key, authKeyId = null) {
  try {
    const res = await pool.query(
      'INSERT INTO webhooks (user_id, name, key, auth_key_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, name, key, authKeyId || null]
    );
    return { success: true, id: res.rows[0].id };
  } catch (err) {
    if (err.code === '23505') {
      return { success: false, message: 'Webhook name and key combination already exists' };
    }
    throw err;
  }
}

async function verifyWebhook(name, key) {
  const res = await pool.query(
    'SELECT id FROM webhooks WHERE name = $1 AND key = $2',
    [name, key]
  );
  return res.rows.length > 0 ? res.rows[0].id : null;
}

async function getWebhookWithAuth(name, key) {
  const res = await pool.query(
    `SELECT 
       w.id, 
       w.user_id, 
       w.name, 
       w.key, 
       w.auth_key_id,
       ak.name AS auth_key_name,
       ak.algorithm AS auth_key_algorithm,
       ak.public_key AS auth_key_public_key,
       ak.expires_at AS auth_key_expires_at,
       ak.key_fingerprint AS auth_key_fingerprint
     FROM webhooks w
     LEFT JOIN auth_keys ak ON ak.id = w.auth_key_id
     WHERE w.name = $1 AND w.key = $2`,
    [name, key]
  );
  return res.rows[0] || null;
}

async function getAllWebhooks(userId, page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT 
       w.id, 
       w.name, 
       w.key, 
       w.auth_key_id,
       ak.name AS auth_key_name,
       ak.algorithm AS auth_key_algorithm,
       w.created_at, 
       COUNT(wl.id)::int AS log_count,
       COUNT(*) OVER() AS total_count 
     FROM webhooks w
     LEFT JOIN auth_keys ak ON ak.id = w.auth_key_id
     LEFT JOIN webhook_logs wl ON wl.webhook_id = w.id
     WHERE w.user_id = $1
  `;
  const params = [userId];
  let paramIdx = 2;

  if (search && search.trim()) {
    sql += ` AND (w.name ILIKE $${paramIdx} OR w.key ILIKE $${paramIdx} OR ak.name ILIKE $${paramIdx})`;
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  sql += `
     GROUP BY w.id, w.name, w.key, w.auth_key_id, ak.name, ak.algorithm, w.created_at
     ORDER BY w.created_at DESC 
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;
  params.push(limit, offset);

  const res = await pool.query(sql, params);
  
  const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
  const data = res.rows.map(row => {
    const { total_count, ...webhook } = row;
    return webhook;
  });
  
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getWebhookById(id, userId) {
  const res = await pool.query(
    `SELECT 
       w.id, 
       w.name, 
       w.key, 
       w.auth_key_id,
       ak.name AS auth_key_name,
       w.created_at 
     FROM webhooks w
     LEFT JOIN auth_keys ak ON ak.id = w.auth_key_id
     WHERE w.id = $1 AND w.user_id = $2`,
    [id, userId]
  );
  return res.rows[0] || null;
}

async function getWebhookOwner(webhookId) {
  const res = await pool.query('SELECT user_id FROM webhooks WHERE id = $1', [webhookId]);
  return res.rows.length > 0 ? res.rows[0].user_id : null;
}

async function getWebhookIdByNameKey(name, key) {
  const res = await pool.query('SELECT id, user_id FROM webhooks WHERE name = $1 AND key = $2', [name, key]);
  return res.rows[0];
}

async function updateWebhook(id, userId, name, key, authKeyId = null) {
  try {
    const res = await pool.query(
      `UPDATE webhooks 
       SET name = $1, key = $2, auth_key_id = $3 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [name, key, authKeyId || null, id, userId]
    );
    if (res.rows.length === 0) throw new Error('Webhook not found or unauthorized');
    return { success: true, webhook: res.rows[0] };
  } catch (err) {
    if (err.code === '23505') {
      return { success: false, error: 'Webhook name and key combination already exists' };
    }
    throw err;
  }
}

async function deleteWebhook(id, userId) {
  const res = await pool.query('DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return res.rows.length > 0;
}

// Logging Methods
async function logWebhookEvent(
  webhookId, 
  method, 
  url, 
  headers, 
  query, 
  body, 
  ip = null, 
  flow_ips = null, 
  location = null, 
  authStatus = 'none', 
  responseStatus = 200, 
  responseBody = 'ok'
) {
  const res = await pool.query(
    `INSERT INTO webhook_logs (
       webhook_id, method, url, headers, query, body, ip, flow_ips, location, auth_status, response_status, response_body
     ) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [
      webhookId,
      method,
      url,
      JSON.stringify(headers || {}),
      JSON.stringify(query || {}),
      JSON.stringify(body || {}),
      ip || null,
      flow_ips || null,
      location ? JSON.stringify(location) : null,
      authStatus,
      responseStatus,
      typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody)
    ]
  );
  return res.rows[0].id;
}

async function getWebhookLogs(webhookId, filters = {}, page = 1, limit = 100) {
  let sql = 'SELECT *, COUNT(*) OVER() as total_count FROM webhook_logs WHERE webhook_id = $1';
  const params = [webhookId];
  let paramIndex = 2;

  if (filters.method && filters.method !== 'ALL') {
    sql += ` AND method = $${paramIndex++}`;
    params.push(filters.method.toUpperCase());
  }

  if (filters.authStatus && filters.authStatus !== 'ALL') {
    sql += ` AND auth_status = $${paramIndex++}`;
    params.push(filters.authStatus.toLowerCase());
  }

  if (filters.search) {
    sql += ` AND (
      headers::TEXT ILIKE $${paramIndex} OR 
      body::TEXT ILIKE $${paramIndex} OR 
      query::TEXT ILIKE $${paramIndex} OR 
      url ILIKE $${paramIndex} OR 
      ip ILIKE $${paramIndex} OR 
      location::TEXT ILIKE $${paramIndex} OR
      response_body ILIKE $${paramIndex}
    )`;
    const searchStr = `%${filters.search}%`;
    params.push(searchStr);
    paramIndex++;
  }

  if (filters.startDate) {
    sql += ` AND created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    sql += ` AND created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  const offset = (page - 1) * limit;
  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const res = await pool.query(sql, params);
  
  const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
  const data = res.rows.map(row => {
    const { total_count, ...log } = row;
    return log;
  });

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function clearWebhookLogs(webhookId) {
  await pool.query('DELETE FROM webhook_logs WHERE webhook_id = $1', [webhookId]);
}

async function cleanupOldDatabaseLogs(days = 30) {
  await pool.query(`DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '${days} days'`);
}

module.exports = {
  initializeDB,
  createUser,
  getUserByUsername,
  getUserById,
  registerWebhook,
  verifyWebhook,
  getWebhookWithAuth,
  getAllWebhooks,
  getWebhookById,
  getWebhookOwner,
  getWebhookIdByNameKey,
  updateWebhook,
  deleteWebhook,
  logWebhookEvent,
  getWebhookLogs,
  clearWebhookLogs,
  cleanupOldDatabaseLogs
};
