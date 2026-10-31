// S1 Team and Project Registration: request handling. Owner: Mostafa Zeiad
const projectService = require('../services/projectService');
const { sendError } = require('../shared/errors');
const { log } = require('../shared/logger');
const { UNIQUE_VIOLATION } = require('../shared/db');
const {
  checkText,
  checkGithubRepo,
  toPositiveInt,
  findUnknownField
} = require('../shared/validate');

const STATUSES = ['pending', 'accepted', 'declined'];
const CREATE_FIELDS = ['title', 'description', 'teamName', 'repoUrl', 'supervisorId'];

// POST /api/projects  ->  201 project       (students only: see routes/projects.js)
async function createProject(req, res, next) {
  try {
    const unknown = findUnknownField(req.body, CREATE_FIELDS);
    if (unknown) {
      // status, supervisionStatus, createdBy ... are set by the server, never by the client
      return sendError(res, 400, 'VALIDATION_ERROR', `Field "${unknown}" is not allowed.`);
    }

    const { title, description, teamName, repoUrl } = req.body;
    const supervisorId = toPositiveInt(req.body.supervisorId);

    const problem =
      checkText(title, 'Title', 3, 120) ||
      checkText(description, 'Description', 10, 1000) ||
      checkText(teamName, 'Team name', 2, 60) ||
      checkGithubRepo(repoUrl) ||
      (supervisorId ? null : 'Supervisor is required.');
    if (problem) return sendError(res, 400, 'VALIDATION_ERROR', problem);

    // Business rules, checked against the database
    if (!(await projectService.isSupervisor(supervisorId))) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'The selected supervisor does not exist.');
    }
    if (await projectService.findProjectIdForStudent(req.user.id)) {
      return sendError(res, 409, 'ALREADY_IN_PROJECT', 'You are already a member of a project.');
    }

    const project = await projectService.createProject(req.user, {
      title: title.trim(),
      description: description.trim(),
      teamName: teamName.trim(),
      repoUrl: repoUrl ? repoUrl.trim().replace(/\/$/, '') : null,
      supervisorId
    });

    log('info', 'project.created', { requestId: req.requestId, userId: req.user.id, projectId: project.id });
    return res.status(201).location(`/api/projects/${project.id}`).json(project);
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return sendError(res, 409, 'ALREADY_IN_PROJECT', 'You are already a member of a project.');
    }
    return next(error);
  }
}

// GET /api/projects?search=&status=  ->  200 [projects]   (any logged-in user, filtered by role)
async function listProjects(req, res, next) {
  try {
    const { search, status } = req.query;

    if (search !== undefined && (typeof search !== 'string' || search.length > 100)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Search must be text of at most 100 characters.');
    }
    if (status !== undefined && !STATUSES.includes(status)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Status must be pending, accepted or declined.');
    }

    const projects = await projectService.listProjects(req.user, {
      search: search ? search.trim() : '',
      status
    });
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
}

// GET /api/projects/:id  ->  200 project with members   (member, its supervisor, or admin)
async function getProject(req, res, next) {
  try {
    const projectId = toPositiveInt(req.params.id);
    if (!projectId) return sendError(res, 400, 'VALIDATION_ERROR', 'Project id must be a positive whole number.');

    const project = await projectService.getProjectForUser(req.user, projectId);
    if (!project) {
      // Same answer for "does not exist" and "not yours", so ids of other teams reveal nothing.
      log('warn', 'project.access_denied_or_missing', { requestId: req.requestId, userId: req.user.id, projectId });
      return sendError(res, 404, 'PROJECT_NOT_FOUND', 'Project not found.');
    }

    const members = await projectService.listMembers(projectId);
    return res.status(200).json({ ...project, members });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createProject, listProjects, getProject };
