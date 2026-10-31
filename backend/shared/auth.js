// Authentication (who are you?) and role checks (what may you do?).
//
// After login the API gives the browser a signed token (JWT). The browser sends it back on
// every request in the header  Authorization: Bearer <token>.  Only the server knows
// JWT_SECRET, so a token that was changed or made up fails the signature check.
const jwt = require('jsonwebtoken');
const config = require('./config');
const { sendError } = require('./errors');
const { log } = require('./logger');

const TOKEN_LIFETIME_SECONDS = 60 * 60; // one hour

function signToken(user) {
  // Only the user id and role go in the token: it is readable (base64), just not changeable.
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: TOKEN_LIFETIME_SECONDS,
    algorithm: 'HS256'
  });
}

// Middleware: rejects requests without a valid, unexpired token (401).
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    log('warn', 'auth.missing_token', { requestId: req.requestId, path: req.path });
    return sendError(res, 401, 'AUTH_REQUIRED', 'You must be logged in.');
  }

  try {
    // algorithms is fixed so a token cannot choose a weaker algorithm (e.g. "none").
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch (error) {
    log('warn', 'auth.invalid_token', {
      requestId: req.requestId,
      path: req.path,
      reason: error.name // e.g. TokenExpiredError; never log the token itself
    });
    return sendError(res, 401, 'AUTH_REQUIRED', 'Your session is invalid or has expired. Please log in again.');
  }
}

// Middleware factory: requireRole('student'), requireRole('supervisor', 'admin') ...
// Must run AFTER requireAuth. Returns 403 for a logged-in user with the wrong role.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      log('warn', 'auth.forbidden_role', {
        requestId: req.requestId,
        path: req.path,
        userId: req.user?.id,
        role: req.user?.role,
        needed: roles
      });
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to do this.');
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole, TOKEN_LIFETIME_SECONDS };
