// Frontend configuration. Nothing here is secret: every visitor can read this file.
// Never put DATABASE_URL, JWT_SECRET or the Turnstile SECRET key here.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Address of the API: local laptop or the deployed Vercel API project.
const API_BASE_URL = isLocal
  ? 'http://localhost:3000/api'
  : 'https://gradtracker-api.vercel.app/api';

// Turnstile SITE key (public). Cloudflare's TEST key for now (Phase 1).
// Final phase: replace the second value with the real site key of your widget.
const TURNSTILE_SITE_KEY = isLocal
  ? '1x00000000000000000000AA'
  : '1x00000000000000000000AA';