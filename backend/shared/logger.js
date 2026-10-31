// Structured logging: one JSON line per event, visible in Vercel > Logs (and in the terminal locally).
// JSON lines can be filtered by field, e.g. "auth.login.failed" or "status":401.
//
// NEVER pass passwords, tokens, connection strings or full request bodies to log().
const crypto = require('crypto');

function log(level, event, fields = {}) {
  const line = { time: new Date().toISOString(), level, event, ...fields };
  const text = JSON.stringify(line);
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

// A short one-way hash of the client IP: lets us spot many failures from one
// address without storing the address itself.
function hashIp(ip) {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);
}

// Middleware: gives every request an id and writes one line when the response is sent.
function requestLogger(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const started = Date.now();

  res.on('finish', () => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    log(level, 'http.request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path, // path only: query strings may contain search text
      status,
      ms: Date.now() - started,
      userId: req.user?.id,
      ipHash: hashIp(req.ip)
    });
  });

  next();
}

module.exports = { log, hashIp, requestLogger };
