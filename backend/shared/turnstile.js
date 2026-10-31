// Cloudflare Turnstile: proves a person (not a script) used the login or registration form.
// The browser widget produces a one-time token and sends it in the X-Turnstile-Token header.
// Only the server knows TURNSTILE_SECRET_KEY, so only the server can ask Cloudflare
// whether the token is genuine. A widget in the browser on its own protects nothing.
const config = require('./config');
const { sendError } = require('./errors');
const { log } = require('./logger');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(req, res, next) {
  if (!config.turnstileSecret) {
    // Allowed on a developer laptop only. config.js reports the missing key in production.
    log('warn', 'turnstile.skipped', { requestId: req.requestId, reason: 'no secret configured' });
    return next();
  }

  const token = req.get('X-Turnstile-Token');
  if (!token || token.length > 2048) {
    log('warn', 'turnstile.missing', { requestId: req.requestId, path: req.path });
    return sendError(res, 403, 'BOT_CHECK_FAILED', 'Please complete the security check and try again.');
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: config.turnstileSecret, response: token, remoteip: req.ip }),
      signal: AbortSignal.timeout(5000)
    });
    const result = await response.json();

    if (result.success !== true) {
      log('warn', 'turnstile.failed', {
        requestId: req.requestId,
        path: req.path,
        errorCodes: result['error-codes']
      });
      return sendError(res, 403, 'BOT_CHECK_FAILED', 'Security check failed. Please try again.');
    }
    return next();
  } catch (error) {
    log('error', 'turnstile.unreachable', { requestId: req.requestId, reason: error.name });
    return sendError(res, 503, 'BOT_CHECK_UNAVAILABLE', 'Security check is unavailable. Please try again shortly.');
  }
}

module.exports = { verifyTurnstile };
