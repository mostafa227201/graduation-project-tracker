# API contract (Week 6: shared auth and S1 first functions)

Base URL: `http://localhost:3000/api` locally, `https://<api-project>.vercel.app/api` in the cloud.
Requests with a body must send `Content-Type: application/json` (otherwise `415`). Bodies over 10 KB get `413`.
Protected routes need `Authorization: Bearer <token>` (otherwise `401`).

Every error has the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Title must contain between 3 and 120 characters." } }
```

## Data dictionary

### User (as returned by the API)

| Field | Type | Rule |
|---|---|---|
| id | integer | Server generated |
| name | string | 2 to 100 characters |
| email | string | Valid email, stored in lower case, unique |
| role | string | `student`, `supervisor` or `admin`. Set by the server only |

`password_hash` is never returned.

### Project

| Field | Type | Source | Rule |
|---|---|---|---|
| id | integer | Server | |
| title | string | Client | 3 to 120 characters |
| description | string | Client | 10 to 1000 characters |
| teamName | string | Client | 2 to 60 characters |
| repoUrl | string or null | Client | Optional, must be `https://github.com/owner/repo` |
| supervisorId | integer | Client | Must be an existing supervisor |
| supervisorName | string | Server | |
| supervisionStatus | string | Server | `pending` on creation; later `accepted` or `declined` (by the supervisor) |
| memberCount | integer | Server | |
| createdAt | string (ISO 8601) | Server | |

## Endpoints

| Method | Path | Who | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | /health | Public | | 200 `{status}` | |
| POST | /auth/register | Public + Turnstile | name, email, password | 201 `{user}` (role always student) | 400, 403, 409, 413, 415, 429 |
| POST | /auth/login | Public + Turnstile | email, password | 200 `{token, expiresIn, user}` | 400, 401, 403, 415, 429 |
| GET | /auth/me | Logged in | | 200 `{user}` | 401 |
| GET | /supervisors | Logged in | | 200 `[{id, name}]` | 401 |
| POST | /projects | Student | title, description, teamName, repoUrl?, supervisorId | 201 project, `Location` header | 400, 401, 403, 409, 415 |
| GET | /projects?search=&status= | Logged in (filtered) | | 200 `[project]` | 400, 401 |
| GET | /projects/{id} | Member, its supervisor, admin | | 200 project + `members` | 400, 401, 404 |

Turnstile: the browser sends the widget token in the `X-Turnstile-Token` header.

### Rules

- Fields that are not listed are rejected with 400 (for example `role` on register, `supervisionStatus` on create).
- A student can be a member of one project only (409 `ALREADY_IN_PROJECT`).
- Project lists: a student sees their own project, a supervisor sees projects they supervise, an admin sees all.
- `GET /projects/{id}` answers 404 both for a missing project and for a project the user may not see.
- `search` matches title or team name, case-insensitive, as plain text (`%` and `_` have no special meaning).
- Login failures always answer `401 INVALID_CREDENTIALS`, whether the email exists or not.
- Five failed logins in 15 minutes from one address answer `429 TOO_MANY_REQUESTS`.

## Error codes

| Status | Code |
|---|---|
| 400 | VALIDATION_ERROR |
| 401 | AUTH_REQUIRED, INVALID_CREDENTIALS |
| 403 | FORBIDDEN, BOT_CHECK_FAILED |
| 404 | PROJECT_NOT_FOUND, ROUTE_NOT_FOUND |
| 409 | EMAIL_TAKEN, ALREADY_IN_PROJECT |
| 413 | PAYLOAD_TOO_LARGE |
| 415 | UNSUPPORTED_MEDIA_TYPE |
| 429 | TOO_MANY_REQUESTS |
| 500 | INTERNAL_ERROR, SERVER_NOT_CONFIGURED |
| 503 | BOT_CHECK_UNAVAILABLE |
