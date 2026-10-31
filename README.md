# Graduation Project Tracker

Group project for 26CSCN29H Cloud Computing and Cloud Security.

Teams register their graduation project with a supervisor and submit four milestones (proposal, prototype, report, defense). Supervisors comment on and approve milestones, and the admin sees which teams are behind schedule.

| Service | Owner |
|---|---|
| S1 Team and Project Registration | Mostafa Zeiad |
| S2 Milestones and Submissions | Seifallah Mohamed |
| S3 Review and Progress Monitoring | Omar Abdelmonem |

Architecture: static frontend on Vercel, Express API as a Vercel Function, Neon Postgres.

## Status (Week 6 checkpoint)

- Shared: register, login (JWT), roles, Turnstile, rate limiting, JSON logging
- S1: register a project, view and search projects, view one project

## Folders

```
frontend/   pages, css, js (config.js, api.js, login.js, projects.js), vercel.json
backend/    server.js, routes/, controllers/, services/, shared/, db/, scripts/
docs/       setup-and-deploy.md, api-contract.md, api-test-plan.md
evidence/   screenshots and test exports
```

Start here: [docs/setup-and-deploy.md](docs/setup-and-deploy.md)
