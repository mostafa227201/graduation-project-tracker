// Server-side validation helpers. The browser also checks input, but only for fast
// feedback: anyone can send requests directly (Postman, curl), so the API checks again.
// Each check returns an error message (string) or null when the value is fine.
const { sendError } = require('./errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}\/?$/;

function checkText(value, label, min, max) {
  if (typeof value !== 'string') return `${label} is required.`;
  const length = value.trim().length;
  if (length < min || length > max) {
    return `${label} must contain between ${min} and ${max} characters.`;
  }
  return null;
}

function checkEmail(value) {
  if (typeof value !== 'string' || value.trim().length > 254 || !EMAIL_PATTERN.test(value.trim())) {
    return 'Email must be a valid email address.';
  }
  return null;
}

function checkPassword(value) {
  if (typeof value !== 'string') return 'Password is required.';
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected.
  if (value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) {
    return 'Password must contain between 8 and 72 characters.';
  }
  return null;
}

// Positive whole number, given as a number (JSON body) or a string (URL path or query).
function toPositiveInt(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || !/^[1-9][0-9]{0,8}$/.test(text)) return null;
  return Number(text);
}

function checkGithubRepo(value) {
  if (value === undefined || value === null || value === '') return null; // optional field
  if (typeof value !== 'string' || !GITHUB_REPO_PATTERN.test(value.trim())) {
    return 'Repository link must look like https://github.com/owner/repository.';
  }
  return null;
}

// Rejects fields the client is not allowed to send (for example "role" or "status").
function findUnknownField(body, allowed) {
  return Object.keys(body).find((key) => !allowed.includes(key)) || null;
}

// Middleware: requests that carry a body must be JSON objects.
function requireJsonBody(req, res, next) {
  if (!req.is('application/json')) {
    return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
  next();
}

module.exports = {
  checkText,
  checkEmail,
  checkPassword,
  toPositiveInt,
  checkGithubRepo,
  findUnknownField,
  requireJsonBody
};
