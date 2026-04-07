
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:ndiruljQqXTyyIfwCINitEMvbrhtcKxM@maglev.proxy.rlwy.net:37274/railway',
  ssl: { rejectUnauthorized: false }
});
async function clear() {
  try {
    await pool.query('DELETE FROM agents');
    console.log('Cleared agents');
    await pool.query('DELETE FROM submissions');
    console.log('Cleared submissions');
    await pool.query('DELETE FROM audit_logs');
    console.log('Cleared audit_logs');
    await pool.query('DELETE FROM crawler_runs');
    console.log('Cleared crawler_runs');
    await pool.query('DELETE FROM featured_requests');
    console.log('Cleared featured_requests');
    await pool.query('DELETE FROM categories');
    console.log('Cleared categories');
    await pool.query('DELETE FROM admin_sessions');
    console.log('Cleared admin_sessions');
    await pool.end();
    console.log('DONE - admin users kept for console login');
  } catch(e) {
    console.error('Error:', e.message);
    await pool.end();
  }
}
clear();
