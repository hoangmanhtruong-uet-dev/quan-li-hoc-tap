/**
 * DEPRECATED: MySQL connection pool is deprecated.
 * CampusOS has migrated 100% to Supabase PostgreSQL.
 * This file provides safe backward-compatibility stubs so no runtime errors occur.
 */

export interface SafeDbStub {
  query: <T = any>(sql: string, values?: any[]) => Promise<[T[], any]>;
  execute: <T = any>(sql: string, values?: any[]) => Promise<[T[], any]>;
  getConnection: () => Promise<{
    beginTransaction: () => Promise<void>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    release: () => void;
    execute: <T = any>(sql: string, values?: any[]) => Promise<[T[], any]>;
    query: <T = any>(sql: string, values?: any[]) => Promise<[T[], any]>;
  }>;
  end: () => Promise<void>;
}

export const pool: SafeDbStub = {
  query: async () => [[] as any[], null],
  execute: async () => [[] as any[], null],
  getConnection: async () => ({
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async () => [[] as any[], null],
    query: async () => [[] as any[], null],
  }),
  end: async () => {},
};

export default pool;
