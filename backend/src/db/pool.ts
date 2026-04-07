const DATABASE_URL = process.env.DATABASE_URL || '';

let db: any;

if (DATABASE_URL && DATABASE_URL.startsWith('postgresql')) {
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
      const statements = sql.split(';').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      if (statements.length === 1 && !statements[0].includes('?')) {
        return pool.query(statements[0]).then(() => ({}));
      }
      return pool.query(sql).then(() => ({}));
    },
    prepare(sql: string) {
      return {
        run(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          return pool.query(pgSql, pgArgs).then((r: any) => ({
            lastInsertRowid: r.rows[0]?.id || r.rows[0]?.lastval,
          }));
        },
        get(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          return pool.query(pgSql, pgArgs).then((r: any) => r.rows[0]);
        },
        all(...args: any[]) {
          const { sql: pgSql, args: pgArgs } = convertToPg(sql, args);
          return pool.query(pgSql, pgArgs).then((r: any) => r.rows);
        },
      };
    },
  };
} else {
  // SQLite mode (local development)
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'hermes.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

export default db;
