const express = require('express');
const usersController = require('../controllers/users');
const { requireAuth } = require('../shared/auth');

const router = express.Router();

router.get('/', requireAuth, usersController.listSupervisors);

module.exports = router;
