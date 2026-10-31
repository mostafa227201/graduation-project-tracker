// Login and student registration page.
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const registerForm = document.querySelector('#register-form');
const registerMessage = document.querySelector('#register-message');

// Already logged in? Go straight to the projects page.
if (session.token()) {
  window.location.href = 'projects.html';
}
if (new URLSearchParams(window.location.search).get('expired')) {
  showMessage(loginMessage, 'Your session has ended. Please log in again.', 'info');
}

// Turnstile widgets (one per form). Cloudflare's script calls this when it is ready.
const widgets = {};
window.onTurnstileLoad = () => {
  widgets.login = turnstile.render('#login-turnstile', { sitekey: TURNSTILE_SITE_KEY });
  widgets.register = turnstile.render('#register-turnstile', { sitekey: TURNSTILE_SITE_KEY });
};

function turnstileToken(name) {
  return window.turnstile && widgets[name] !== undefined ? turnstile.getResponse(widgets[name]) : '';
}

// A Turnstile token can be used once, so the widget is reset after every attempt.
function resetTurnstile(name) {
  if (window.turnstile && widgets[name] !== undefined) turnstile.reset(widgets[name]);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if (!email || !password) {
    return showMessage(loginMessage, 'Enter your email and password.', 'error');
  }

  const button = loginForm.querySelector('button');
  button.disabled = true;
  showMessage(loginMessage, 'Logging in...', 'info');

  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
      headers: { 'X-Turnstile-Token': turnstileToken('login') }
    });
    session.save(result.token, result.user);
    window.location.href = 'projects.html';
  } catch (error) {
    showMessage(loginMessage, error.message, 'error');
    resetTurnstile('login');
  } finally {
    button.disabled = false;
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = registerForm.name.value.trim();
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value;

  // Quick checks for fast feedback only. The API checks everything again.
  if (name.length < 2) return showMessage(registerMessage, 'Enter your full name.', 'error');
  if (!email.includes('@')) return showMessage(registerMessage, 'Enter a valid email address.', 'error');
  if (password.length < 8) return showMessage(registerMessage, 'Password must have at least 8 characters.', 'error');

  const button = registerForm.querySelector('button');
  button.disabled = true;
  showMessage(registerMessage, 'Creating account...', 'info');

  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      headers: { 'X-Turnstile-Token': turnstileToken('register') }
    });
    registerForm.reset();
    loginForm.email.value = email;
    showMessage(registerMessage, 'Account created. You can now log in.', 'success');
  } catch (error) {
    showMessage(registerMessage, error.message, 'error');
  } finally {
    resetTurnstile('register');
    button.disabled = false;
  }
});
