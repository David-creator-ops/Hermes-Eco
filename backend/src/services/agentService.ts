import db from '../db/pool';

function parse(row: any) {
  try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
  try { row.tools_used = JSON.parse(row.tools_used || '[]'); } catch { row.tools_used = []; }
  try { row.verification_checks = JSON.parse(row.verification_checks || '{}'); } catch { row.verification_checks = {}; }
  try { row.tier2_categories = JSON.parse(row.tier2_categories || '[]'); } catch { row.tier2_categories = []; }
  try { row.use_cases = JSON.parse(row.use_cases || '[]'); } catch { row.use_cases = []; }
  try { row.required_skills = JSON.parse(row.required_skills || '[]'); } catch { row.required_skills = []; }
  try { row.external_dependencies = JSON.parse(row.external_dependencies || '[]'); } catch { row.external_dependencies = []; }
  try { row.compatible_resources = JSON.parse(row.compatible_resources || '[]'); } catch { row.compatible_resources = []; }
  return row;
}

interface ListOpts {
  page?: number; limit?: number; sort?: string;
  type?: string; resource_type?: string; verification_status?: string;
  tier2_categories?: string; complexity_level?: string; deployment_type?: string;
  required_skills?: string; maintenance_status?: string;
  tools_used?: string; tags?: string; search?: string; category_slug?: string;
}

export function listAgents(opts: ListOpts = {}) {
  const page = opts.page || 1;
  const limit = Math.min(opts.limit || 20, 100);
  const offset = (page - 1) * limit;
  const sortCol = opts.sort === 'popular' || opts.sort === 'stars' ? 'a.stars DESC'
    : opts.sort === 'verified' ? 'a.verification_score DESC, a.stars DESC'
    : 'a.created_at DESC';

  const w: string[] = ['a.is_archived = 0'];
  const p: any[] = [];
  let join = '';

  if (opts.resource_type) { w.push('a.resource_type = ?'); p.push(opts.resource_type); }
  if (opts.type) { w.push('a.type = ?'); p.push(opts.type); }
  if (opts.verification_status) { w.push('a.verification_status = ?'); p.push(opts.verification_status); }
  if (opts.complexity_level) { w.push('a.complexity_level = ?'); p.push(opts.complexity_level); }
  if (opts.deployment_type) { w.push('a.deployment_type = ?'); p.push(opts.deployment_type); }
  if (opts.maintenance_status) { w.push('a.maintenance_status = ?'); p.push(opts.maintenance_status); }

  if (opts.category_slug) {
    join = 'JOIN agent_categories ac ON ac.agent_id = a.id JOIN categories c ON c.id = ac.category_id';
    w.push('c.slug = ?'); p.push(opts.category_slug);
  }

  let extra = '';
  if (opts.tools_used) {
    extra += ' AND EXISTS (SELECT 1 FROM json_each(a.tools_used) WHERE value = ?)';
    p.push(opts.tools_used);
  }
  if (opts.tier2_categories) {
    extra += ' AND EXISTS (SELECT 1 FROM json_each(a.tier2_categories) WHERE value = ?)';
    p.push(opts.tier2_categories);
  }
  if (opts.required_skills) {
    extra += ' AND EXISTS (SELECT 1 FROM json_each(a.required_skills) WHERE value = ?)';
    p.push(opts.required_skills);
  }
  if (opts.tags) {
    extra += ' AND EXISTS (SELECT 1 FROM json_each(a.tags) WHERE value = ?)';
    p.push(opts.tags);
  }

  let searchParams: any[] = [];
  if (opts.search) {
    const sp = `%${opts.search}%`;
    extra += ' AND (a.name LIKE ? OR a.description LIKE ? OR a.author_github LIKE ?)';
    searchParams = [sp, sp, sp];
  }

  const where = w.join(' AND ');
  await const count: any = db.prepare(`SELECT COUNT(*) as total FROM agents a ${join} WHERE ${where}`).get(...p);
  const rows = db.prepare(
    `SELECT a.* FROM agents a ${join} WHERE ${where} ${extra} ORDER BY ${sortCol} LIMIT ? OFFSET ?`
  await ).all(...p, ...searchParams, limit, offset) as any[];

  return { agents: rows.map(parse), total: count.total, page, limit };
}

export function getAgentById(id: number) {
  await const row = db.prepare('SELECT * FROM agents WHERE id = ? AND is_archived = 0').get(id) as any;
  return row ? parse(row) : null;
}

export function getAgentBySlug(slug: string) {
  await const row = db.prepare('SELECT * FROM agents WHERE slug = ? AND is_archived = 0').get(slug) as any;
  return row ? parse(row) : null;
}

export function getFeaturedAgents(n = 4) {
  await return db.prepare('SELECT * FROM agents WHERE is_featured = 1 AND is_archived = 0 ORDER BY stars DESC LIMIT ?').all(n).map(parse);
}

export function getRecentAgents(n = 10) {
  await return db.prepare('SELECT * FROM agents WHERE is_archived = 0 ORDER BY created_at DESC LIMIT ?').all(n).map(parse);
}

export function getAgentsByResourceType(resourceType: string, n = 10) {
  await return db.prepare('SELECT * FROM agents WHERE resource_type = ? AND is_archived = 0 ORDER BY stars DESC LIMIT ?').all(resourceType, n).map(parse);
}

export function upsertAgent(data: {
  name: string; slug: string; resource_type: string; type: string; description: string; long_description?: string;
  author_github: string; repository_url: string; homepage_url?: string; license?: string;
  hermes_version_required?: string; tier1_category?: string; tier1_subcategory?: string;
  tier2_categories?: string[]; use_cases?: string[]; complexity_level?: string; deployment_type?: string;
  required_skills?: string[]; external_dependencies?: string[]; maintenance_status?: string;
  tags?: string[]; tools_used?: string[]; verification_score: number;
  verification_status: string; verification_checks: Record<string, boolean>;
  stars: number; forks: number; watchers: number; last_commit_date?: string;
}) {
  db.prepare(`
    INSERT INTO agents (
      name, slug, resource_type, type, description, long_description,
      author_github, repository_url, homepage_url, license, hermes_version_required,
      tier1_category, tier1_subcategory, tier2_categories, use_cases,
      complexity_level, deployment_type, required_skills, external_dependencies, maintenance_status,
      tags, tools_used, verification_status, verification_score,
      verification_checks, stars, forks, watchers,
      updated_at, last_crawled
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
    ON CONFLICT(repository_url) DO UPDATE SET
      name=excluded.name, description=excluded.description,
      tags=excluded.tags, tools_used=excluded.tools_used,
      verification_status=excluded.verification_status,
      verification_score=excluded.verification_score,
      verification_checks=excluded.verification_checks,
      stars=excluded.stars, forks=excluded.forks, watchers=excluded.watchers,
      updated_at=excluded.updated_at, is_archived=0
  await `).run(
    data.name, data.slug, data.resource_type, data.type, data.description, data.long_description ?? null,
    data.author_github, data.repository_url, data.homepage_url ?? null,
    data.license ?? null, data.hermes_version_required ?? null,
    data.tier1_category ?? null, data.tier1_subcategory ?? null,
    JSON.stringify(data.tier2_categories ?? []), JSON.stringify(data.use_cases ?? []),
    data.complexity_level ?? null, data.deployment_type ?? null,
    JSON.stringify(data.required_skills ?? []), JSON.stringify(data.external_dependencies ?? []),
    data.maintenance_status ?? 'active',
    JSON.stringify(data.tags ?? []), JSON.stringify(data.tools_used ?? []),
    data.verification_status, data.verification_score, JSON.stringify(data.verification_checks ?? {}),
    data.stars, data.forks, data.watchers
  );
}

export function getResourceStats() {
  await return db.prepare("SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC").all() as any[];
}

export function getCategoryStats() {
  return db.prepare(`
    SELECT c.name, c.slug, c.icon, c.type, COUNT(ac.agent_id) as count
    FROM categories c
    LEFT JOIN agent_categories ac ON ac.category_id = c.id
    WHERE c.type = 'usecase'
    GROUP BY c.id
    ORDER BY count DESC
  await `).all() as any[];
}

export function getComplexityStats() {
  await return db.prepare("SELECT complexity_level, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY complexity_level ORDER BY count DESC").all() as any[];
}

export function getDeploymentStats() {
  await return db.prepare("SELECT deployment_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY deployment_type ORDER BY count DESC").all() as any[];
}

export function getMaintenanceStats() {
  await return db.prepare("SELECT maintenance_status, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY maintenance_status ORDER BY count DESC").all() as any[];
}
