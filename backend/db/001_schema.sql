-- Graduation Project Tracker: schema version 1 (Week 6 checkpoint)
-- Run once in the Neon SQL Editor, first on the development branch, then on production.
-- Later files (002_..., 003_...) add the milestone, submission and comment tables.

CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT         NOT NULL,
  role          TEXT         NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title              VARCHAR(120)  NOT NULL,
  description        VARCHAR(1000) NOT NULL,
  team_name          VARCHAR(60)   NOT NULL,
  repo_url           VARCHAR(200),
  supervisor_id      INTEGER       NOT NULL REFERENCES users (id),
  supervision_status TEXT          NOT NULL DEFAULT 'pending'
                     CHECK (supervision_status IN ('pending', 'accepted', 'declined')),
  created_by         INTEGER       NOT NULL REFERENCES users (id),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- A student can belong to one project only, so user_id is UNIQUE.
CREATE TABLE project_members (
  project_id INTEGER     NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL UNIQUE REFERENCES users (id),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX projects_supervisor_idx ON projects (supervisor_id);
