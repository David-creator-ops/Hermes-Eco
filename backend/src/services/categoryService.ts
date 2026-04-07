import db from '../db/pool';

const DATABASE_URL = process.env.DATABASE_URL || '';
const IS_POSTGRES = DATABASE_URL.startsWith('postgresql');

// The category system uses tier2_categories (JSON array) on agents, NOT agent_categories join table.
// Categories are seeded as use-case names and agents list them in tier2_categories.

export async function getAllCategories() {
  // Get unique tier2_categories from agents + count
  if (IS_POSTGRES) {
    const rows = await db.prepare(`
      SELECT unnest(ARRAY_AGG(DISTINCT elem)) as category
      FROM agents,
        jsonb_array_elements_text(tier2_categories::jsonb) as elem
      WHERE agents.is_archived = 0
    `).all() as any[];

    const results = [];
    for (const row of (rows || [])) {
      if (row.category) {
        const count = await db.prepare(
          `SELECT COUNT(*) as c FROM agents WHERE is_archived = 0 AND tier2_categories::jsonb @> ($1::jsonb)`
        ).get(JSON.stringify([row.category])) as any;
        results.push({ name: row.category, slug: row.category, icon: '', type: 'usecase', count: count?.c || 0 });
      }
    }
    return results.sort((a: any, b: any) => b.count - a.count);
  }
  return [];
}

export async function getCategoryBySlug(slug: string) {
  // Find agents that have this slug in their tier2_categories array
  if (IS_POSTGRES) {
    const count = await db.prepare(
      `SELECT COUNT(*) as c FROM agents WHERE is_archived = 0 AND tier2_categories::jsonb @> ($1::jsonb)`
    ).get(JSON.stringify([slug])) as any;

    return { name: slug, slug, icon: '', type: 'usecase', count: count?.c || 0 };
  }
  return null;
}

export async function getAgentsByCategory(slug: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  if (IS_POSTGRES) {
    const count = await db.prepare(
      `SELECT COUNT(*) as total FROM agents WHERE is_archived = 0 AND tier2_categories::jsonb @> ($1::jsonb)`
    ).get(JSON.stringify([slug])) as any;

    const rows = await db.prepare(`
      SELECT * FROM agents
      WHERE is_archived = 0 AND tier2_categories::jsonb @> ($1::jsonb)
      ORDER BY created_at DESC LIMIT $2 OFFSET $3
    `).all(JSON.stringify([slug]), limit, offset) as any[];

    function parse(row: any) {
      try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
      try { row.tools_used = JSON.parse(row.tools_used || '[]'); } catch { row.tools_used = []; }
      try { row.verification_checks = JSON.parse(row.verification_checks || '{}'); } catch { row.verification_checks = {}; }
      try { row.tier2_categories = JSON.parse(row.tier2_categories || '[]'); } catch { row.tier2_categories = []; }
      try { row.use_cases = JSON.parse(row.use_cases || '[]'); } catch { row.use_cases = []; }
      return row;
    }

    return { agents: (rows || []).map(parse), total: count?.total || 0 };
  }
  return { agents: [], total: 0 };
}
