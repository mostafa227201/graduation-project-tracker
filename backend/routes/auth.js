const express = require('express');
const authController = require('../controllers/auth');
const { requireAuth } = require('../shared/auth');
const { requireJsonBody } = require('../shared/validate');
const { verifyTurnstile } = require('../shared/turnstile');
const { loginLimiter, registerLimiter } = require('../shared/rateLimits');

const router = express.Router();

// Middleware run left to right: JSON check -> rate limit -> bot check -> controller
router.post('/register', requireJsonBody, registerLimiter, verifyTurnstile, authController.register);
router.post('/login', requireJsonBody, loginLimiter, verifyTurnstile, authController.login);
router.get('/me', requireAuth, authController.me);

module.exports = router;
