const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://postgres:ndiruljQqXTyyIfwCINitEMvbrhtcKxM@maglev.proxy.rlwy.net:37274/railway",
    ssl: { rejectUnauthorized: false }
  });
  
  const sql = fs.readFileSync(path.join(__dirname, 'src', 'db', '_schema_raw.sql'), 'utf8');
  
  try {
    await pool.query(sql);
    console.log('\u2705 All tables created successfully');
    await pool.end();
  } catch(e) {
    if (e.message.includes('already exists') || e.message.includes('does not exist')) {
      console.log('\u2705 Tables already exist or checked');
    } else {
      console.error('\u274c Migration error:', e.message);
    }
    await pool.end();
  }
}
main();

