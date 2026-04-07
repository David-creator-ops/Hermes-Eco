import db from '../db/pool';

export function getAllCategories() {
  await return db.prepare('SELECT c.*, (SELECT COUNT(*) FROM agent_categories ac WHERE ac.category_id = c.id) as count FROM categories c ORDER BY c.name').all() as any[];
}

export function getCategoryBySlug(slug: string) {
  await const row = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM agent_categories ac WHERE ac.category_id = c.id) as count FROM categories c WHERE c.slug = ?`).get(slug) as any;
  return row || null;
}

export function getAgentsByCategory(slug: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const count = db.prepare(
    'SELECT COUNT(*) as total FROM agents a JOIN agent_categories ac ON ac.agent_id = a.id JOIN categories c ON c.id = ac.category_id WHERE c.slug = ? AND a.is_archived = 0'
  await ).get(slug) as { total: number };

  const rows = db.prepare(`
    SELECT a.* FROM agents a
    JOIN agent_categories ac ON ac.agent_id = a.id
    JOIN categories c ON c.id = ac.category_id
    WHERE c.slug = ? AND a.is_archived = 0
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  await `).all(slug, limit, offset) as any[];

  function parse(row: any) {
    try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
    try { row.tools_used = JSON.parse(row.tools_used || '[]'); } catch { row.tools_used = []; }
    try { row.verification_checks = JSON.parse(row.verification_checks || '{}'); } catch { row.verification_checks = {}; }
    return row;
  }

  return { agents: rows.map(parse), total: count.total };
}
