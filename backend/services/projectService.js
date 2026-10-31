// S1 Team and Project Registration: data operations for projects and project_members.
// Owner: Mostafa Zeiad
const { getSql } = require('../shared/db');

// The columns returned for a project, with camelCase names for the JSON response.
const PROJECT_COLUMNS = `
  p.id,
  p.title,
  p.description,
  p.team_name          AS "teamName",
  p.repo_url           AS "repoUrl",
  p.supervision_status AS "supervisionStatus",
  p.created_at         AS "createdAt",
  s.id                 AS "supervisorId",
  s.name               AS "supervisorName",
  (SELECT count(*)::int FROM project_members pm WHERE pm.project_id = p.id) AS "memberCount"`;

async function isSupervisor(userId) {
  const sql = getSql();
  const rows = await sql`SELECT 1 FROM users WHERE id = ${userId} AND role = 'supervisor'`;
  return rows.length > 0;
}

async function findProjectIdForStudent(userId) {
  const sql = getSql();
  const rows = await sql`SELECT project_id FROM project_members WHERE user_id = ${userId}`;
  return rows[0] ? rows[0].project_id : null;
}

// Creates the project AND adds the student as its first member in ONE statement,
// so the database never holds a project without its creator (or the other way round).
// If the student joined another project at the same moment, the UNIQUE constraint on
// project_members.user_id fails and the whole statement is undone.
async function createProject(user, input) {
  const sql = getSql();
  const rows = await sql`
    WITH new_project AS (
      INSERT INTO projects (title, description, team_name, repo_url, supervisor_id, created_by)
      VALUES (${input.title}, ${input.description}, ${input.teamName}, ${input.repoUrl},
              ${input.supervisorId}, ${user.id})
      RETURNING id
    ), new_member AS (
      INSERT INTO project_members (project_id, user_id)
      SELECT id, ${user.id} FROM new_project
    )
    SELECT id FROM new_project`;
  return getProjectById(rows[0].id);
}

async function getProjectById(id) {
  const sql = getSql();
  const rows = await sql.query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects p JOIN users s ON s.id = p.supervisor_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// Escapes % and _ so search text is matched literally inside ILIKE.
function likePattern(text) {
  return `%${text.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

// Lists the projects this user is allowed to see:
//   student    -> only the project they are a member of
//   supervisor -> only projects they supervise (or were asked to supervise)
//   admin      -> all projects
// The filter is built in SQL here, on the server, not in the browser.
async function listProjects(user, { search, status }) {
  const sql = getSql();
  const conditions = [];
  const params = [];

  if (user.role === 'student') {
    params.push(user.id);
    conditions.push(`EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = $${params.length})`);
  } else if (user.role === 'supervisor') {
    params.push(user.id);
    conditions.push(`p.supervisor_id = $${params.length}`);
  } else if (user.role !== 'admin') {
    return []; // unknown role sees nothing
  }

  if (search) {
    params.push(likePattern(search));
    conditions.push(`(p.title ILIKE $${params.length} OR p.team_name ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.supervision_status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // Only fixed SQL text and $n placeholders are joined above; user input travels in params.
  return sql.query(
    `SELECT ${PROJECT_COLUMNS}
     FROM projects p JOIN users s ON s.id = p.supervisor_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT 100`,
    params
  );
}

// Access rule shared with S2 and S3: may this user see this project?
// Returns the project, or null when it does not exist OR the user may not see it
// (the caller answers 404 in both cases so other teams' projects are not revealed).
async function getProjectForUser(user, projectId) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  if (user.role === 'admin') return project;
  if (user.role === 'supervisor' && project.supervisorId === user.id) return project;
  if (user.role === 'student' && (await findProjectIdForStudent(user.id)) === project.id) return project;
  return null;
}

async function listMembers(projectId) {
  const sql = getSql();
  return sql`
    SELECT u.id, u.name, m.joined_at AS "joinedAt"
    FROM project_members m JOIN users u ON u.id = m.user_id
    WHERE m.project_id = ${projectId}
    ORDER BY m.joined_at`;
}

module.exports = {
  isSupervisor,
  findProjectIdForStudent,
  createProject,
  getProjectById,
  listProjects,
  getProjectForUser,
  listMembers,
  likePattern
};
