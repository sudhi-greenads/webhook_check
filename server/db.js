const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://webhook_user:webhook_pass@localhost:5432/webhook_db',
});

module.exports = pool;
