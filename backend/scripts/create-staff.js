// Creates a supervisor or admin account. Staff accounts are never created through the
// public API, so a student cannot make themselves an admin.
//
// Run from the backend folder (uses DATABASE_URL from backend/.env):
//   npm run create-staff -- supervisor "Dr Sara Ali" sara.ali@example.edu
//   npm run create-staff -- admin "Project Coordinator" coordinator@example.edu
// The password is typed in the terminal, so it never appears in shell history or Git.
const readline = require('readline');
const config = require('../shared/config');
const userService = require('../services/userService');
const { checkText, checkEmail, checkPassword } = require('../shared/validate');

async function askPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question('Password for this account (8 to 72 characters): ', resolve));
  rl.close();
  return answer;
}

async function main() {
  const [role, name, email] = process.argv.slice(2);

  if (!['supervisor', 'admin'].includes(role)) {
    throw new Error('Role must be "supervisor" or "admin".');
  }
  const problem = checkText(name, 'Name', 2, 100) || checkEmail(email);
  if (problem) throw new Error(problem);
  if (!config.databaseUrl) throw new Error('DATABASE_URL is missing in backend/.env.');

  const password = await askPassword();
  const passwordProblem = checkPassword(password);
  if (passwordProblem) throw new Error(passwordProblem);

  const user = await userService.createUser({ name, email, password, role });
  console.log(`Created ${user.role} #${user.id}: ${user.name} <${user.email}>`);
}

main().catch((error) => {
  console.error(error.code === '23505' ? 'That email is already registered.' : error.message);
  process.exit(1);
});
