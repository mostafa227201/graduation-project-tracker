// Graduation Project Tracker API (Express 5). Runs locally with `npm run dev`
// and on Vercel as one serverless function.
const express = require('express');
const cors = require('cors');
const config = require('./shared/config');
const { log, requestLogger } = require('./shared/logger');
const { sendError } = require('./shared/errors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const supervisorRoutes = require('./routes/users');

const app = express();

// Vercel sits in front of the function as a proxy; trust its X-Forwarded-For header
// so req.ip (used by rate limiting) is the visitor's address.
if (process.env.VERCEL) app.set('trust proxy', 1);
app.disable('x-powered-by');

if (!config.isConfigured) {
  // Names only, never values.
  log('error', 'config.missing', { settings: config.problems });
}

// 1. Request id + one log line per request
app.use(requestLogger);

// 2. Only our own frontend origins may call the API from a browser
app.use(cors({
  origin: config.corsOrigins,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Turnstile-Token'],
  exposedHeaders: ['X-Request-Id']
}));

// 3. Basic security headers for API responses (the frontend sets its own in vercel.json)
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer'
  });
  next();
});

// 4. Parse JSON bodies, max 10 KB
app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({ name: 'Graduation Project Tracker API', health: '/api/health' });
});

// Health check: works even when the database is not configured
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: config.isConfigured ? 'ok' : 'misconfigured' });
});

// Refuse to run real routes with missing settings (clear 500 instead of strange errors)
app.use('/api', (req, res, next) => {
  if (!config.isConfigured) {
    return sendError(res, 500, 'SERVER_NOT_CONFIGURED', 'The server is not configured yet.');
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/supervisors', supervisorRoutes);

// Route not found
app.use((req, res) => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', 'Route not found.');
});

// Central error handler: details go to the log, never to the client
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request body is not valid JSON.');
  }
  if (error.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }
  log('error', 'server.error', {
    requestId: req.requestId,
    path: req.path,
    name: error.name,
    message: error.message,
    stack: config.isProduction ? undefined : error.stack
  });
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
});

app.listen(config.port, () => {
  console.log(`Graduation Project Tracker API on http://localhost:${config.port}`);
});

// Same pattern as Lab 5: Vercel turns this Express app into one serverless function.

module.exports = app;
