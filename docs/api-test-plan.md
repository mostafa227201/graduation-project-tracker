# API test plan (Week 6: shared auth and S1)

Run each test locally first, then against the deployed API. Fill in "Result" (Pass/Fail) and keep a screenshot in `evidence/`.
Requests are in `backend/requests.http`. Locally use the Turnstile dummy token `XXXX.DUMMY.TOKEN.XXXX`.

| ID | Type | Request | Expected | Local | Cloud |
|---|---|---|---|---|---|
| T01 | Normal | GET /health | 200 `{"status":"ok"}` | | |
| T02 | Normal | Register a student with valid data | 201, role is student, no password hash in response | | |
| T03 | Invalid | Register with email `abc` | 400 VALIDATION_ERROR | | |
| T04 | Invalid | Register with a 5-character password | 400 VALIDATION_ERROR | | |
| T05 | Security | Register with `"role": "admin"` in the body | 400, account not created | | |
| T06 | Invalid | Register the same email twice | 409 EMAIL_TAKEN | | |
| T07 | Normal | Log in with correct details | 200 with token | | |
| T08 | Security | Log in with wrong password, then with unknown email | Both 401 INVALID_CREDENTIALS, same message | | |
| T09 | Security | Six wrong logins in a row | 6th answers 429 TOO_MANY_REQUESTS | | |
| T10 | Security | Login without X-Turnstile-Token (cloud, real secret) | 403 BOT_CHECK_FAILED | n/a | |
| T11 | Security | GET /projects without token | 401 AUTH_REQUIRED | | |
| T12 | Security | GET /projects with a token whose middle part was edited | 401 AUTH_REQUIRED | | |
| T13 | Normal | Student creates a project with valid data | 201, status pending, memberCount 1 | | |
| T14 | Invalid | Create with title `Hi`, bad repo link, missing supervisor | 400 with a clear message each time | | |
| T15 | Security | Create with `"supervisionStatus": "accepted"` | 400, field not allowed | | |
| T16 | Invalid | Create with supervisorId of a student | 400 | | |
| T17 | Invalid | Same student creates a second project | 409 ALREADY_IN_PROJECT | | |
| T18 | Security | Supervisor or admin token on POST /projects | 403 FORBIDDEN | | |
| T19 | Invalid | POST /projects with Content-Type text/plain | 415 | | |
| T20 | Normal | Student lists projects | Only their own project | | |
| T21 | Normal | Supervisor lists projects | Only projects they supervise | | |
| T22 | Normal | Admin lists with search and status filter | Matching projects only | | |
| T23 | Security | Search `' OR 1=1 --` | 200 with no rows, no error | | |
| T24 | Invalid | GET /projects?status=approved | 400 | | |
| T25 | Security | Student opens another team's project id | 404 PROJECT_NOT_FOUND | | |
| T26 | Security | Supervisor opens a project of another supervisor | 404 | | |
| T27 | Security | Project title `<img src=x onerror=alert(1)>` shown in the page | Shown as text, no script runs | | |
| T28 | Security | Persistence: refresh, second browser, Neon table | Project still there | | |
| T29 | Security | Secret review: `git log -p` and GitHub search for DATABASE_URL, JWT_SECRET | Nothing found | | |
| T30 | Security | `curl -I` on the web URL | CSP, X-Frame-Options, nosniff, HSTS present | | |
