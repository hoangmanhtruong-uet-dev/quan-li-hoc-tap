import mysql from 'mysql2/promise';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const pool = mysql.createPool({
  host: required('DB_HOST'),
  port: Number(required('DB_PORT')),
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const [tables] = await pool.execute('SHOW TABLES');
  console.log('Tables:', tables.map(r => Object.values(r)[0]).join(', '));

  for (const table of ['users', 'student_profiles', 'team_workspaces', 'team_memberships', 'team_tasks', 'email_verifications', 'password_resets']) {
    try {
      const [cols] = await pool.execute(`SHOW COLUMNS FROM ${table}`);
      console.log(`${table}:`, cols.map((r) => `${r.Field}:${r.Type}`).join(', '));
      const [indexes] = await pool.execute(`SHOW INDEX FROM ${table}`);
      console.log(`${table} indexes:`, indexes.map((r) => `${r.Key_name}(${r.Column_name})`).join(', '));
    } catch { /* skip */ }
  }
  await pool.end();
}
main();
