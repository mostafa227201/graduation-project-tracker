// Shared request helper used by every page. It adds the API address, the JSON headers
// and the login token, and turns API errors into readable messages.
const TOKEN_KEY = 'gpt.token';
const USER_KEY = 'gpt.user';

// The token is kept for this browser tab only (sessionStorage) and expires after one hour.
const session = {
  save(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  token() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  user() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
};

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// apiRequest('/projects', { method: 'POST', body: {...}, headers: {...} })
async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const requestHeaders = { Accept: 'application/json', ...headers };
  const token = session.token();
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  let data = null;
  if ((response.headers.get('content-type') || '').includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    // Expired or invalid login: forget it and go back to the login page.
    if (response.status === 401 && token) {
      session.clear();
      window.location.href = 'index.html?expired=1';
    }
    const message = data?.error?.message || `Request failed (${response.status}).`;
    throw new ApiError(response.status, data?.error?.code || 'UNKNOWN', message);
  }

  return data;
}

// Writes a message safely (textContent, never innerHTML) and colours it.
function showMessage(element, text, kind = 'info') {
  element.textContent = text;
  element.dataset.kind = kind;
}
