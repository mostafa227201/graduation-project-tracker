// S1 Team and Project Registration routes. Owner: Mostafa Zeiad
const express = require('express');
const projectController = require('../controllers/projects');
const { requireAuth, requireRole } = require('../shared/auth');
const { requireJsonBody } = require('../shared/validate');

const router = express.Router();

// Every project route needs a logged-in user.
router.use(requireAuth);

router.post('/', requireRole('student'), requireJsonBody, projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProject);

module.exports = router;
