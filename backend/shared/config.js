// Reads every setting from environment variables (backend/.env locally, Vercel dashboard in the cloud).
// No secret is ever written in the source code.
require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const config = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: (process.env.DATABASE_URL || '').trim(),
  jwtSecret: (process.env.JWT_SECRET || '').trim(),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  turnstileSecret: (process.env.TURNSTILE_SECRET_KEY || '').trim()
};

// Names of required settings that are missing or too weak. Only the NAMES are
// logged, never the values.
const problems = [];
if (!config.databaseUrl) problems.push('DATABASE_URL');
if (config.jwtSecret.length < 32) problems.push('JWT_SECRET (missing or shorter than 32 characters)');
if (isProduction && !config.turnstileSecret) problems.push('TURNSTILE_SECRET_KEY');

config.problems = problems;
config.isConfigured = problems.length === 0;

module.exports = config;
