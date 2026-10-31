// Shared authentication: register, login, current user. (Lead: Mostafa Zeiad)
// Controller = validate the request, call the service, choose the status code.
const userService = require('../services/userService');
const { signToken, TOKEN_LIFETIME_SECONDS } = require('../shared/auth');
const { sendError } = require('../shared/errors');
const { log, hashIp } = require('../shared/logger');
const { UNIQUE_VIOLATION } = require('../shared/db');
const { checkText, checkEmail, checkPassword, findUnknownField } = require('../shared/validate');

// POST /api/auth/register  ->  201 { user }
// Anyone can create a STUDENT account. Supervisor and admin accounts are created
// by staff (scripts/create-staff.js), never through this endpoint.
async function register(req, res, next) {
  try {
    const unknown = findUnknownField(req.body, ['name', 'email', 'password']);
    if (unknown) {
      // e.g. a client trying {"role": "admin"} is refused, not silently ignored
      log('warn', 'auth.register.rejected_field', { requestId: req.requestId, field: unknown });
      return sendError(res, 400, 'VALIDATION_ERROR', `Field "${unknown}" is not allowed.`);
    }

    const { name, email, password } = req.body;
    const problem = checkText(name, 'Name', 2, 100) || checkEmail(email) || checkPassword(password);
    if (problem) return sendError(res, 400, 'VALIDATION_ERROR', problem);

    const user = await userService.createUser({ name, email, password, role: 'student' });
    log('info', 'auth.register', { requestId: req.requestId, userId: user.id });
    return res.status(201).json({ user });
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return sendError(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists.');
    }
    return next(error);
  }
}

// POST /api/auth/login  ->  200 { token, expiresIn, user }
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    // Same generic message for every failure so the response does not reveal
    // whether the email exists.
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const user = await userService.checkCredentials(email, password);
    if (!user) {
      log('warn', 'auth.login.failed', { requestId: req.requestId, ipHash: hashIp(req.ip) });
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }

    log('info', 'auth.login.success', { requestId: req.requestId, userId: user.id, role: user.role });
    return res.status(200).json({
      token: signToken(user),
      expiresIn: TOKEN_LIFETIME_SECONDS,
      user
    });
  } catch (error) {
    return next(error);
  }
}

// GET /api/auth/me  ->  200 { user }   (requireAuth runs first)
async function me(req, res, next) {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) return sendError(res, 401, 'AUTH_REQUIRED', 'Account no longer exists.');
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me };
