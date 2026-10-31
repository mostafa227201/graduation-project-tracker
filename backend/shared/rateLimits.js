// Rate limits slow down password guessing and mass account creation.
// Limitation (documented): on Vercel each function instance keeps its own counters in memory,
// so the limit is per instance, not global. A shared store would fix this but is beyond
// coursework scale. Turnstile and bcrypt add further protection.
const { rateLimit } = require('express-rate-limit');
const { log, hashIp } = require('./logger');

function limitReached(event, message) {
  return (req, res) => {
    log('warn', event, { requestId: req.requestId, path: req.path, ipHash: hashIp(req.ip) });
    res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message } });
  };
}

// 5 FAILED logins per 15 minutes per address. Successful logins do not count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitReached('auth.login.rate_limited', 'Too many failed logins. Try again in 15 minutes.')
});

// 10 registrations per hour per address.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitReached('auth.register.rate_limited', 'Too many accounts created. Try again later.')
});

module.exports = { loginLimiter, registerLimiter };
