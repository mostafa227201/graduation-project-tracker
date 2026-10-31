# Setup and deployment (Week 6 checkpoint)

Goal: login plus S1 "register project" and "view/search projects" working on public HTTPS URLs.

Accounts needed (all free, sign in with the same GitHub account): GitHub, Neon (Free plan), Vercel (Hobby, "personal projects", do not start the Pro trial), Cloudflare (Free).

Never commit `backend/.env`, and never put a secret value in a screenshot.

## 1. Push the code to GitHub

1. Create an empty **private** repository `graduation-project-tracker` (no README, .gitignore or licence).
2. Add Seifallah and Omar as collaborators (Settings > Collaborators).
3. In the project folder:

```bash
git init
git branch -M main
git add .
git status          # STOP if .env appears in the list
git commit -m "Add project skeleton, login and S1 project registration"
git remote add origin https://github.com/YOUR-USERNAME/graduation-project-tracker.git
git push -u origin main
```

4. On GitHub: Settings > Code security > turn on **Secret scanning** and **Push protection** if your account offers them (on private repositories they may need a paid plan; then rely on `.gitignore`, `git status` before every commit and the secret review in test T29).
5. Settings > Branches > add a rule for `main`: require a pull request with 1 approval.

## 2. Create the database on Neon

1. Create a Neon project `graduation-project-tracker`. Pick the region closest to your Vercel functions (for example Frankfurt `eu-central-1`).
2. Neon creates a `production` branch. Create a second branch called `development` (Branches > New branch).
3. On **each** branch, open SQL Editor and run `backend/db/001_schema.sql`.
4. Least privilege (recommended now, required before the final demo): run `backend/db/002_app_role.sql` on each branch after replacing `CHANGE-ME` with a long random password. Do not save the real password in the file.
5. Connect > choose the branch > copy the pooled connection string. If you created `app_user`, replace the user name and password at the start of the string (`postgresql://USER:PASSWORD@...`) with `app_user` and its password. The string is a secret.

## 3. Run locally

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Fill in `backend/.env`:

- `DATABASE_URL` = the **development** branch connection string
- `JWT_SECRET` = output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- leave `CORS_ORIGINS` and the Turnstile TEST secret as they are

```bash
npm install
npm run create-staff -- supervisor "Dr Sara Ali" sara.ali@example.edu
npm run create-staff -- admin "Project Coordinator" coordinator@example.edu
npm run dev                 # API on http://localhost:3000
```

Second terminal:

```bash
cd frontend
npm install
npm start                   # http://localhost:8080
```

Check: open http://localhost:3000/api/health (status ok), create a student account at http://localhost:8080, log in, register a project, refresh, and see it in Neon's Tables view. Run the requests in `backend/requests.http` and record results in `docs/api-test-plan.md`.

## 4. Deploy the API on Vercel

1. Vercel > Add New > Project > import the repository.
2. Project name `gradtracker-api`, **Root Directory `backend`**. Keep the detected settings.
3. Environment Variables (Production):

| Name | Value |
|---|---|
| `DATABASE_URL` | **production** branch connection string |
| `JWT_SECRET` | a NEW random value (not the local one) |
| `CORS_ORIGINS` | `http://localhost:8080` for now |
| `TURNSTILE_SECRET_KEY` | `1x0000000000000000000000000000000AA` for now (step 6 replaces it) |
| `NODE_ENV` | `production` |

4. Deploy. Open `https://gradtracker-api.vercel.app/api/health` (your domain may differ). Expected: `{"status":"ok"}`. If it says `misconfigured`, open Vercel > Logs and look for `config.missing`, which lists the missing setting names.
5. Create the staff accounts on production: temporarily put the production `DATABASE_URL` in your local `.env`, run the two `create-staff` commands, then switch `.env` back to the development string.

## 5. Deploy the frontend on Vercel

1. In `frontend/js/config.js` replace `YOUR-API-PROJECT` with the API domain.
2. In `frontend/vercel.json` replace `YOUR-API-PROJECT` in `connect-src` with the same domain.
3. Commit and push.
4. Vercel > Add New > Project > import the same repository again. Name `gradtracker-web`, **Root Directory `frontend`**, Framework preset Other, no build command.
5. Back in the API project, set `CORS_ORIGINS` to `http://localhost:8080,https://gradtracker-web.vercel.app` (exact origin, no trailing slash) and **Redeploy** the API.

## 6. Turn on real Turnstile

1. Cloudflare dashboard > Turnstile > Add widget. Hostname: your web domain (for example `gradtracker-web.vercel.app`). Mode: Managed.
2. Put the **Site Key** in `frontend/js/config.js` (replace `YOUR-TURNSTILE-SITE-KEY`). Commit and push.
3. Put the **Secret Key** in the API project's `TURNSTILE_SECRET_KEY` on Vercel. Redeploy the API.
4. Test: log in on the public site (works). Send a login request from Postman without `X-Turnstile-Token` (expect `403 BOT_CHECK_FAILED`).

## 7. Final check and evidence (save in `evidence/`)

- [ ] `/api/health` returns ok over HTTPS
- [ ] Register, log in, register a project and search, all on the public web URL
- [ ] Refresh and log in from a second browser: the project is still there (Neon)
- [ ] `curl -I https://gradtracker-web.vercel.app` shows the security headers
- [ ] Security tests from `docs/api-test-plan.md` run against the deployed API
- [ ] Vercel Logs filtered by `auth.login.failed` shows a failed login (no password in it)
- [ ] `git status` clean, no `.env` on GitHub

Screenshots: Network tab with the API calls, Neon table rows (no connection string), Vercel deployments, Vercel log filter, Postman results.
