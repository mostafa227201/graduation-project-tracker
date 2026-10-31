// Frontend configuration. Nothing here is secret: every visitor can read this file.
// Never put DATABASE_URL, JWT_SECRET or the Turnstile SECRET key here.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Replace YOUR-API-PROJECT with the domain of your Vercel API project.
const API_BASE_URL = isLocal
  ? 'http://localhost:3000/api'
  : 'https://YOUR-API-PROJECT.vercel.app/api';

// Turnstile SITE key (public). Locally: Cloudflare's test key that always passes.
// Replace YOUR-TURNSTILE-SITE-KEY with the site key of your widget.
const TURNSTILE_SITE_KEY = isLocal
  ? '1x00000000000000000000AA'
  : 'YOUR-TURNSTILE-SITE-KEY';
