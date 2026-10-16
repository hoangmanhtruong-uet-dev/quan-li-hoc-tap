import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

function loadLocalEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

loadLocalEnv();

const connection = await mysql.createConnection({
  host: required('DB_HOST'),
  port: Number(required('DB_PORT')),
  user: required('DB_USER'),
  password: required('DB_PASSWORD'),
  database: required('DB_NAME'),
  ssl: { rejectUnauthorized: false },
});

async function hasColumn(table, column) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows.length > 0;
}

async function hasIndex(table, index) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index],
  );
  return rows.length > 0;
}

async function hasForeignKey(table, constraint) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
        AND table_name = ? AND constraint_name = ?`,
    [table, constraint],
  );
  return rows.length > 0;
}

async function assertNoDuplicates(query, message) {
  const [rows] = await connection.execute(query);
  if (rows.length > 0) throw new Error(message);
}

async function run() {
  if (!(await hasColumn('team_workspaces', 'type'))) {
    await connection.execute(
      "ALTER TABLE team_workspaces ADD COLUMN type ENUM('PERSONAL','CLUB','HOUSEHOLD') NULL AFTER description",
    );
  }
  await connection.execute(
    "UPDATE team_workspaces SET type = CASE WHEN name = 'Personal' THEN 'PERSONAL' ELSE 'CLUB' END WHERE type IS NULL",
  );
  await connection.execute(
    "ALTER TABLE team_workspaces MODIFY COLUMN type ENUM('PERSONAL','CLUB','HOUSEHOLD') NOT NULL",
  );

  await assertNoDuplicates(
    `SELECT owner_user_id FROM team_workspaces
      WHERE type = 'PERSONAL'
      GROUP BY owner_user_id HAVING COUNT(*) > 1`,
    'Duplicate personal workspaces found; resolve them before applying the unique constraint.',
  );

  if (!(await hasColumn('team_workspaces', 'personal_owner_user_id'))) {
    await connection.execute(
      `ALTER TABLE team_workspaces
       ADD COLUMN personal_owner_user_id VARCHAR(36) NULL`,
    );
  }
  await connection.execute(
    `UPDATE team_workspaces
        SET personal_owner_user_id = CASE
          WHEN type = 'PERSONAL' THEN owner_user_id ELSE NULL
        END`,
  );
  if (!(await hasIndex('team_workspaces', 'uq_personal_workspace_owner'))) {
    await connection.execute(
      'CREATE UNIQUE INDEX uq_personal_workspace_owner ON team_workspaces(personal_owner_user_id)',
    );
  }
  if (!(await hasIndex('team_workspaces', 'idx_workspace_type'))) {
    await connection.execute('CREATE INDEX idx_workspace_type ON team_workspaces(type)');
  }

  await connection.execute('ALTER TABLE team_memberships MODIFY COLUMN role VARCHAR(20) NOT NULL');
  await connection.execute(
    `UPDATE team_memberships
        SET role = CASE UPPER(role)
          WHEN 'OWNER' THEN 'OWNER'
          WHEN 'ADMIN' THEN 'ADMIN'
          WHEN 'MANAGER' THEN 'MANAGER'
          WHEN 'VIEWER' THEN 'VIEWER'
          ELSE 'MEMBER'
        END`,
  );
  await connection.execute(
    "ALTER TABLE team_memberships MODIFY COLUMN role ENUM('OWNER','ADMIN','MANAGER','MEMBER','VIEWER') NOT NULL DEFAULT 'MEMBER'",
  );

  if (!(await hasColumn('team_memberships', 'created_at'))) {
    await connection.execute(
      'ALTER TABLE team_memberships ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    );
    await connection.execute('UPDATE team_memberships SET created_at = joined_at WHERE joined_at IS NOT NULL');
  }
  if (!(await hasColumn('team_memberships', 'updated_at'))) {
    await connection.execute(
      'ALTER TABLE team_memberships ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    );
  }

  await assertNoDuplicates(
    `SELECT team_workspace_id, user_id FROM team_memberships
      GROUP BY team_workspace_id, user_id HAVING COUNT(*) > 1`,
    'Duplicate workspace memberships found; resolve them before applying the unique constraint.',
  );
  if (!(await hasIndex('team_memberships', 'uq_workspace_membership'))) {
    await connection.execute(
      'CREATE UNIQUE INDEX uq_workspace_membership ON team_memberships(team_workspace_id, user_id)',
    );
  }
  if (!(await hasIndex('team_memberships', 'idx_membership_user_workspace'))) {
    await connection.execute(
      'CREATE INDEX idx_membership_user_workspace ON team_memberships(user_id, team_workspace_id)',
    );
  }

  if (!(await hasForeignKey('team_workspaces', 'fk_workspace_owner'))) {
    await connection.execute(
      'ALTER TABLE team_workspaces ADD CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
  }
  if (!(await hasForeignKey('team_memberships', 'fk_membership_workspace'))) {
    await connection.execute(
      'ALTER TABLE team_memberships ADD CONSTRAINT fk_membership_workspace FOREIGN KEY (team_workspace_id) REFERENCES team_workspaces(id) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
  }
  if (!(await hasForeignKey('team_memberships', 'fk_membership_user'))) {
    await connection.execute(
      'ALTER TABLE team_memberships ADD CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT',
    );
  }

  await connection.execute(
    `INSERT IGNORE INTO team_workspaces
       (id, owner_user_id, personal_owner_user_id, name, type)
     SELECT UUID(), u.id, u.id, 'Personal', 'PERSONAL' FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM team_workspaces w
         WHERE w.owner_user_id = u.id AND w.type = 'PERSONAL'
      )`,
  );
  await connection.execute(
    `INSERT IGNORE INTO team_memberships
       (id, team_workspace_id, user_id, role, created_at, updated_at)
     SELECT UUID(), w.id, w.owner_user_id, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       FROM team_workspaces w
      WHERE NOT EXISTS (
        SELECT 1 FROM team_memberships m
         WHERE m.team_workspace_id = w.id AND m.user_id = w.owner_user_id
      )`,
  );
  await connection.execute(
    `UPDATE team_memberships m
       JOIN team_workspaces w
         ON w.id = m.team_workspace_id AND w.owner_user_id = m.user_id
        SET m.role = 'OWNER'
      WHERE m.role <> 'OWNER'`,
  );
}

try {
  await run();
  console.log('Phase 5B migration completed successfully.');
} finally {
  await connection.end();
}
