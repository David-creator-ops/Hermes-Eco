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

export async function updateSubmission(id: number, status: string, details?: Record<string, any>) {
  const sql = IS_POSTGRES
    ? "UPDATE submissions SET status = ?, verification_details = CASE WHEN ? IS NOT NULL THEN (?::jsonb)::text ELSE verification_details END, verified_at = CURRENT_TIMESTAMP WHERE id = ?"
    : "UPDATE submissions SET status = ?, verification_details = CASE WHEN ? IS NOT NULL THEN ? ELSE verification_details END, verified_at = datetime('now') WHERE id = ?";
  await db.prepare(sql).run(status, details ? JSON.stringify(details) : null, JSON.stringify(details), id);
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
