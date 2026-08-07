const pool = require('../db');

// Initialize database schema
async function initializeDB() {
  const client = await pool.connect();
  try {
    // Drop existing tables to apply the new schema with users
    // COMMENTED OUT FOR PRODUCTION: We now handle schema initialization in Docker via schema.sql
    // await client.query(`DROP TABLE IF EXISTS webhook_logs CASCADE;`);
    // await client.query(`DROP TABLE IF EXISTS webhooks CASCADE;`);
    // await client.query(`DROP TABLE IF EXISTS users CASCADE;`);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
      )
    `);
    console.log("PostgreSQL Database initialized with Auth schema.");
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
async function registerWebhook(userId, name, key) {
  try {
    const res = await pool.query(
      'INSERT INTO webhooks (user_id, name, key) VALUES ($1, $2, $3) RETURNING id',
      [userId, name, key]
    );
    return { success: true, id: res.rows[0].id };
  } catch (err) {
    if (err.code === '23505') { // unique violation code
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

async function getAllWebhooks(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const res = await pool.query(
    'SELECT id, name, key, created_at, COUNT(*) OVER() as total_count FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  
  const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
  const data = res.rows.map(row => {
    const { total_count, ...webhook } = row;
    return webhook;
  });
  
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getWebhookOwner(webhookId) {
  const res = await pool.query('SELECT user_id FROM webhooks WHERE id = $1', [webhookId]);
  return res.rows.length > 0 ? res.rows[0].user_id : null;
}

async function getWebhookIdByNameKey(name, key) {
  const res = await pool.query('SELECT id, user_id FROM webhooks WHERE name = $1 AND key = $2', [name, key]);
  return res.rows[0];
}

async function updateWebhook(id, userId, name, key) {
  try {
    const res = await pool.query(
      'UPDATE webhooks SET name = $1, key = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, key, id, userId]
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
async function logWebhookEvent(webhookId, method, url, headers, query, body) {
  const res = await pool.query(
    'INSERT INTO webhook_logs (webhook_id, method, url, headers, query, body) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [
      webhookId,
      method,
      url,
      JSON.stringify(headers || {}),
      JSON.stringify(query || {}),
      JSON.stringify(body || {})
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

  if (filters.search) {
    sql += ` AND (headers::TEXT ILIKE $${paramIndex} OR body::TEXT ILIKE $${paramIndex} OR query::TEXT ILIKE $${paramIndex} OR url ILIKE $${paramIndex})`;
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
  getAllWebhooks,
  getWebhookOwner,
  getWebhookIdByNameKey,
  updateWebhook,
  deleteWebhook,
  logWebhookEvent,
  getWebhookLogs,
  clearWebhookLogs,
  cleanupOldDatabaseLogs
};
