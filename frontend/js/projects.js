// S1 Team and Project Registration page. Owner: Mostafa Zeiad
// Register a project (students) and view/search the projects the user may see.
const user = session.user();
if (!session.token() || !user) {
  window.location.href = 'index.html';
  throw new Error('Not logged in'); // stop running the rest of this file
}

const userLine = document.querySelector('#user-line');
const logoutButton = document.querySelector('#logout-button');
const registerPanel = document.querySelector('#register-panel');
const projectForm = document.querySelector('#project-form');
const projectMessage = document.querySelector('#project-message');
const supervisorSelect = document.querySelector('#supervisor');
const filterForm = document.querySelector('#filter-form');
const listHeading = document.querySelector('#list-heading');
const listMessage = document.querySelector('#list-message');
const projectsList = document.querySelector('#projects-list');

const ROLE_LABELS = { student: 'Student', supervisor: 'Supervisor', admin: 'Admin' };
const HEADINGS = { student: 'My project', supervisor: 'Projects I supervise', admin: 'All projects' };

userLine.textContent = `${user.name} (${ROLE_LABELS[user.role] || user.role})`;
listHeading.textContent = HEADINGS[user.role] || 'Projects';

logoutButton.addEventListener('click', () => {
  session.clear();
  window.location.href = 'index.html';
});

// Small helper: create an element with text (always textContent, never HTML).
function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderProjects(projects) {
  projectsList.replaceChildren();

  if (projects.length === 0) {
    projectsList.append(el('p', 'No projects found.', 'hint'));
    return;
  }

  projects.forEach((project) => {
    const card = el('article', undefined, 'card');
    const status = el('span', project.supervisionStatus, `badge badge-${project.supervisionStatus}`);
    const heading = el('h3', project.title);
    heading.append(' ', status);

    const meta = el('p',
      `Team: ${project.teamName} | Supervisor: ${project.supervisorName} | Members: ${project.memberCount}`,
      'meta');
    const description = el('p', project.description);
    card.append(heading, meta, description);

    if (project.repoUrl) {
      const link = el('a', project.repoUrl);
      link.href = project.repoUrl; // only github.com links pass API validation
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.append(link);
    }

    card.append(el('p', `Registered ${new Date(project.createdAt).toLocaleDateString()}`, 'hint'));
    projectsList.append(card);
  });
}

// View/search: GET /api/projects?search=&status=
async function loadProjects() {
  const params = new URLSearchParams();
  const search = filterForm.search.value.trim();
  const status = filterForm.status.value;
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  showMessage(listMessage, 'Loading projects...', 'info');
  try {
    const query = params.toString() ? `?${params}` : '';
    const projects = await apiRequest(`/projects${query}`);
    renderProjects(projects);
    showMessage(listMessage, '');

    // Students without a project see the registration form.
    const unfiltered = !search && !status;
    if (user.role === 'student' && unfiltered) {
      registerPanel.hidden = projects.length > 0;
    }
  } catch (error) {
    showMessage(listMessage, `Could not load projects: ${error.message}`, 'error');
  }
}

async function loadSupervisors() {
  try {
    const supervisors = await apiRequest('/supervisors');
    supervisorSelect.replaceChildren(el('option', 'Choose a supervisor'));
    supervisorSelect.firstChild.value = '';
    supervisors.forEach((s) => {
      const option = el('option', s.name);
      option.value = String(s.id);
      supervisorSelect.append(option);
    });
  } catch (error) {
    showMessage(projectMessage, `Could not load supervisors: ${error.message}`, 'error');
  }
}

// Create: POST /api/projects
projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = {
    title: projectForm.title.value.trim(),
    description: projectForm.description.value.trim(),
    teamName: projectForm.teamName.value.trim(),
    supervisorId: Number(projectForm.supervisorId.value)
  };
  const repoUrl = projectForm.repoUrl.value.trim();
  if (repoUrl) body.repoUrl = repoUrl;

  // Fast feedback only; the API validates again.
  if (body.title.length < 3) return showMessage(projectMessage, 'Title must have at least 3 characters.', 'error');
  if (body.description.length < 10) return showMessage(projectMessage, 'Description must have at least 10 characters.', 'error');
  if (body.teamName.length < 2) return showMessage(projectMessage, 'Enter a team name.', 'error');
  if (!body.supervisorId) return showMessage(projectMessage, 'Choose a supervisor.', 'error');

  const button = projectForm.querySelector('button');
  button.disabled = true;
  showMessage(projectMessage, 'Registering project...', 'info');

  try {
    const project = await apiRequest('/projects', { method: 'POST', body });
    projectForm.reset();
    showMessage(projectMessage, `Project "${project.title}" registered. Waiting for the supervisor to accept.`, 'success');
    await loadProjects();
  } catch (error) {
    showMessage(projectMessage, error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadProjects();
});

if (user.role === 'student') loadSupervisors();
loadProjects();
