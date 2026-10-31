-- Least privilege: a database role for the API that can read and write rows
-- but cannot create, alter or drop tables.
--
-- 1. Replace CHANGE-ME with a long random password (do NOT commit the real one).
-- 2. Run this in the Neon SQL Editor as the project owner, after 001_schema.sql.
-- 3. Build a connection string that uses app_user and this password, and put THAT
--    string in DATABASE_URL (local .env and Vercel). Keep the owner role for schema changes only.

CREATE ROLE app_user WITH LOGIN PASSWORD 'CHANGE-ME';

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Tables created later by the owner also get the same rights automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
