import db from '../db/pool';

const DATABASE_URL = process.env.DATABASE_URL || '';
const IS_POSTGRES = DATABASE_URL.startsWith('postgresql');

export async function getDashboardStats() {
  const total = (await db.prepare('SELECT COUNT(*) as total FROM agents WHERE is_archived = 0').get()) as any;
  const pending = (await db.prepare("SELECT COUNT(*) as total FROM submissions WHERE status = 'pending'").get()) as any;
  const verified = (await db.prepare("SELECT COUNT(*) as total FROM agents WHERE verification_status = 'verified' AND is_archived = 0").get()) as any;
  const featured = (await db.prepare('SELECT COUNT(*) as total FROM agents WHERE is_featured = 1 AND is_archived = 0').get()) as any;

  const newCount = (await db.prepare(
    IS_POSTGRES
      ? "SELECT COUNT(*) as total FROM agents WHERE created_at::timestamp > CURRENT_TIMESTAMP - INTERVAL '30 days'"
      : "SELECT COUNT(*) as total FROM agents WHERE created_at > datetime('now', '-30 days')"
  ).get()) as any;

  return {
    total: total?.total || 0,
    pending: pending?.total || 0,
    verified: verified?.total || 0,
    featured: featured?.total || 0,
    newThisMonth: newCount?.total || 0,
  };
}

export async function listSubmissions(status?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  const submissions = await db.prepare(
    `SELECT * FROM submissions ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  ).all(...params) as any[];
  const total = (await db.prepare(
    status ? 'SELECT COUNT(*) as total FROM submissions WHERE status = ?' : 'SELECT COUNT(*) as total FROM submissions'
  ).get(...params)) as any;
  return { submissions: submissions || [], total: total?.total || 0, page, limit };
}

export async function approveSubmission(id: number) {
  const sql = IS_POSTGRES
    ? "UPDATE submissions SET status = 'approved', verified_at = CURRENT_TIMESTAMP WHERE id = ?"
    : "UPDATE submissions SET status = 'approved', verified_at = datetime('now') WHERE id = ?";
  await db.prepare(sql).run(id);
}

export async function rejectSubmission(id: number) {
  await db.prepare("UPDATE submissions SET status = 'rejected' WHERE id = ?").run(id);
}

export async function getRecentAuditLogs(limit = 20) {
  return (await db.prepare(
    'SELECT l.*, u.username as admin_username FROM audit_logs l LEFT JOIN admin_users u ON u.id = l.admin_id ORDER BY l.created_at DESC LIMIT ?'
  ).all(limit)) as any[];
}

export async function getVerificationBreakdown() {
  return (await db.prepare(
    "SELECT verification_status, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY verification_status"
  ).all()) as any[];
}

export async function login(username: string, password: string) {
  const bcrypt = require('bcryptjs');
  const user = await db.prepare(
    'SELECT * FROM admin_users WHERE username = ? AND is_active = 1'
  ).get(username) as any;

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return user;
}

export async function recordLogin(userId: number) {
  const sql = IS_POSTGRES
    ? "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    : "UPDATE admin_users SET last_login = datetime('now') WHERE id = ?";
  await db.prepare(sql).run(userId);
}

export async function createSession(userId: number, tokenHash: string) {
  const sql = IS_POSTGRES
    ? "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL '7 days')"
    : "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+7 days'))";
  await db.prepare(sql).run(userId, tokenHash);
}

export async function verifySession(tokenHash: string) {
  const sql = IS_POSTGRES
    ? "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP"
    : "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')";

  return db.prepare(sql).get(tokenHash) as any;
}

export async function deleteSession(tokenHash: string) {
  await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
}

export async function listUsers() {
  return db.prepare('SELECT id, username, email, role, is_active, last_login, created_at FROM admin_users ORDER BY id').all() as any[];
}

export async function createUser(data: { username: string; email: string; password: string; role: string }) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(data.password, 12);
  return db.prepare(
    'INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(data.username, data.email, hash, data.role);
}

export async function updateUser(data: { id: number; email?: string; role?: string; is_active?: number }) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
  if (fields.length === 0) return;
  values.push(data.id);
  await db.prepare(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export async function deleteUser(id: number) {
  await db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);
}

export const auditLog = async (data: { admin_id: number; action: string; resource_type?: string; resource_id?: number; change_details?: string; ip_address?: string }) => {
  await db.prepare(
    'INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, change_details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.admin_id, data.action, data.resource_type ?? null, data.resource_id ?? null, data.change_details ?? null, data.ip_address ?? null);
};

export async function getCrawlerSettings() {
  return db.prepare('SELECT key, value FROM crawler_settings').all() as any[];
}

export async function updateCrawlerSetting(key: string, value: string) {
  const now = IS_POSTGRES ? 'CURRENT_TIMESTAMP' : "datetime('now')";
  await db.prepare(
    `INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, ${now}) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ${now}`
  ).run(key, value, value);
}

export async function listFeaturedRequests() {
  return db.prepare('SELECT * FROM featured_requests ORDER BY created_at DESC').all() as any[];
}

export async function updateFeaturedRequest(id: number, status: string, reviewerId?: number) {
  const sql = IS_POSTGRES
    ? "UPDATE featured_requests SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE id = ?"
    : "UPDATE featured_requests SET status = ?, reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?";
  await db.prepare(sql).run(status, reviewerId ?? null, id);
}

export async function listCrawlerRuns() {
  return db.prepare('SELECT * FROM crawler_runs ORDER BY started_at DESC LIMIT 20').all() as any[];
}

export async function seedDefaultUsers() {
  const bcrypt = require('bcryptjs');
  const count = await db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as any;
  if (count.c > 0) return; // Already seeded

  const adminHash = await bcrypt.hash('hermes2026', 12);
  const modHash = await bcrypt.hash('mod2026', 12);
  const opsHash = await bcrypt.hash('ops2026', 12);

  await db.prepare(
    "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
  ).run('admin', 'admin@hermeseco.dev', adminHash, 'super_admin');

  console.log('✅ Seeded default admin users');
}

// ── Functions required by adminRoutes.ts ──

export async function authenticateUser(username: string, password: string) {
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');
  
  const user = await db.prepare(
    'SELECT * FROM admin_users WHERE username = ? AND is_active = 1'
  ).get(username) as any;
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  // Create session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = IS_POSTGRES
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(
    "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
  ).run(user.id, token, expiresAt);

  await db.prepare(
    "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(user.id);

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  };
}

export async function verifyToken(tokenHash: string) {
  const sql = IS_POSTGRES
    ? "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP"
    : "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')";

  return (await db.prepare(sql).get(tokenHash)) as any;
}

export async function getCrawlerSetting(key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM crawler_settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

export async function hashBcrypt(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
}
