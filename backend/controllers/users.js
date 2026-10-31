// Shared: lists supervisors for the "requested supervisor" drop-down.
const userService = require('../services/userService');

// GET /api/supervisors  ->  200 [{ id, name }]   (any logged-in user)
async function listSupervisors(req, res, next) {
  try {
    const supervisors = await userService.listSupervisors();
    return res.status(200).json(supervisors);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listSupervisors };
