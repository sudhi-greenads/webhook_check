const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://webhook_user:webhook_pass@localhost:5432/webhook_db',
});

// Initialize database schema
async function initializeDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
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
    console.log("PostgreSQL Database initialized.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL:", err);
  } finally {
    client.release();
  }
}

// Export it instead of running automatically

async function registerWebhook(name, key) {
  try {
    const res = await pool.query(
      'INSERT INTO webhooks (name, key) VALUES ($1, $2) RETURNING id',
      [name, key]
    );
    return { success: true, id: res.rows[0].id };
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation code
      return { success: true, message: 'Already registered' };
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

async function getAllWebhooks() {
  const res = await pool.query('SELECT name, key, created_at FROM webhooks ORDER BY created_at DESC');
  return res.rows || [];
}

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

async function getWebhookLogs(webhookId, filters = {}) {
  let sql = 'SELECT * FROM webhook_logs WHERE webhook_id = $1';
  const params = [webhookId];
  let paramIndex = 2;

  if (filters.method && filters.method !== 'ALL') {
    sql += ` AND method = $${paramIndex++}`;
    params.push(filters.method.toUpperCase());
  }

  if (filters.search) {
    // In PostgreSQL, searching JSONB requires casting to text or using JSONB operators
    // For a generic search across everything, casting to TEXT is easiest
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

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(parseInt(filters.limit) || 100);
  params.push(parseInt(filters.offset) || 0);

  const res = await pool.query(sql, params);
  return res.rows;
}

async function clearWebhookLogs(webhookId) {
  await pool.query('DELETE FROM webhook_logs WHERE webhook_id = $1', [webhookId]);
}

async function cleanupOldDatabaseLogs(days = 30) {
  await pool.query(`DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '${days} days'`);
}

module.exports = {
  initializeDB,
  registerWebhook,
  verifyWebhook,
  getAllWebhooks,
  logWebhookEvent,
  getWebhookLogs,
  clearWebhookLogs,
  cleanupOldDatabaseLogs
};
