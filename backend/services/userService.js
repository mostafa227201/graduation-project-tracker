// Data operations for the users table. Controllers never write SQL themselves.
const bcrypt = require('bcryptjs');
const { getSql } = require('../shared/db');

const BCRYPT_COST = 12;

// Compared against when the email does not exist, so a wrong email takes about as long
// as a wrong password and response time does not reveal which accounts exist.
// Created on first use so it does not slow down every cold start.
let dummyHash = null;
async function getDummyHash() {
  if (!dummyHash) dummyHash = await bcrypt.hash('not-a-real-password', BCRYPT_COST);
  return dummyHash;
}

// Columns that are safe to send to the browser (never password_hash).
function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

async function createUser({ name, email, password, role }) {
  const sql = getSql();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${passwordHash}, ${role})
    RETURNING id, name, email, role`;
  return toPublicUser(rows[0]);
}

// Returns the user when email and password match, otherwise null.
async function checkCredentials(email, password) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, role, password_hash
    FROM users
    WHERE email = ${email.trim().toLowerCase()}`;
  const user = rows[0];

  const matches = await bcrypt.compare(password, user ? user.password_hash : await getDummyHash());
  return user && matches ? toPublicUser(user) : null;
}

async function findById(id) {
  const sql = getSql();
  const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${id}`;
  return rows[0] ? toPublicUser(rows[0]) : null;
}

// For the "requested supervisor" drop-down: names only, no emails.
async function listSupervisors() {
  const sql = getSql();
  return sql`SELECT id, name FROM users WHERE role = 'supervisor' ORDER BY name`;
}

module.exports = { createUser, checkCredentials, findById, listSupervisors };
