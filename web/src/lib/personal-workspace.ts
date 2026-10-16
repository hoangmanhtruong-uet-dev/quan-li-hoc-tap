import crypto from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from './db';

export async function ensurePersonalWorkspace(userId: string): Promise<string> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute<ResultSetHeader>(
      `INSERT IGNORE INTO team_workspaces
         (id, owner_user_id, personal_owner_user_id, name, type)
       VALUES (?, ?, ?, 'Personal', 'PERSONAL')`,
      [crypto.randomUUID(), userId, userId],
    );
    const [workspaces] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM team_workspaces
        WHERE owner_user_id = ? AND type = 'PERSONAL'
        LIMIT 1 FOR UPDATE`,
      [userId],
    );
    const workspaceId = workspaces[0]?.id as string | undefined;
    if (!workspaceId) throw new Error('Unable to ensure personal workspace');

    await connection.execute<ResultSetHeader>(
      `INSERT INTO team_memberships (id, team_workspace_id, user_id, role)
       VALUES (?, ?, ?, 'OWNER')
       ON DUPLICATE KEY UPDATE role = 'OWNER', updated_at = CURRENT_TIMESTAMP`,
      [crypto.randomUUID(), workspaceId, userId],
    );
    await connection.commit();
    return workspaceId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
