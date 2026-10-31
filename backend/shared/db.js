// One database client for every service. The Neon driver sends each query over HTTPS,
// which suits serverless functions (no long-lived connection to keep open).
//
// Two ways to run a query, both parameterised (values are never pasted into the SQL text):
//   sql`SELECT * FROM users WHERE id = ${id}`         tagged template
//   sql.query('SELECT * FROM users WHERE id = $1', [id])  text + parameter list
const { neon } = require('@neondatabase/serverless');
const config = require('./config');

const sql = config.databaseUrl ? neon(config.databaseUrl) : null;

function getSql() {
  if (!sql) {
    throw new Error('DATABASE_URL is not set.');
  }
  return sql;
}

// Postgres error code for "unique constraint violated"
const UNIQUE_VIOLATION = '23505';

module.exports = { getSql, UNIQUE_VIOLATION };
