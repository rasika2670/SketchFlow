const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL from environment for connection string.
 */
const pool = new Pool({
  connectionString: config.db.url,
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail connect after 5s
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});

// Log pool errors (don't crash the process)
pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a SQL query with parameterized values.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  logger.debug('Executed query', {
    text: text.substring(0, 100),
    duration: `${duration}ms`,
    rows: result.rowCount,
  });

  return result;
}

/**
 * Get a client from the pool for transactions.
 * IMPORTANT: Always release the client in a finally block.
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ PostgreSQL connected');
    return true;
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed', { error: err.message });
    throw err;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
