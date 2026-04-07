import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || '';
const IS_POSTGRES = DATABASE_URL.startsWith('postgresql');

let db: any;

if (IS_POSTGRES) {
  // PostgreSQL mode (Railway production)
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  function convertToPg(sql: string, args: any[]) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => { idx++; return '$' + idx; });
    return { sql: pgSql, args };
  }

  db = {
    exec(sql: string) {
      console.log('PostgreSQL: skipping exec() for table creation (tables managed separately)');
      return Promise.resolve({});
    },
    prepare(sql: string) {
      return {
        async run(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          const r = await pool.query(pgSql, pgArgs);
          return { lastInsertRowid: r.rows[0]?.id };
        },
        async get(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          const r = await pool.query(pgSql, pgArgs);
          return r.rows[0];
        },
        async all(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          const r = await pool.query(pgSql, pgArgs);
          return r.rows;
        },
      };
    },
  };
} else {
  // SQLite mode (local development)
  const Database = require('better-sqlite3');
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'hermes.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

export default db;

