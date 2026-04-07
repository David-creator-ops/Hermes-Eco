import db from '../db/pool';

const DATABASE_URL = process.env.DATABASE_URL || '';
const IS_POSTGRES = DATABASE_URL.startsWith('postgresql');

export async function getEcosystemStats() {
  const totalResult = await db.prepare(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE verification_status = 'verified') as verified, AVG(verification_score) as avg_score FROM agents WHERE is_archived = 0"
  ).get() as any;

  const newMonth = await db.prepare(
    IS_POSTGRES
      ? "SELECT COUNT(*) as count FROM agents WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' AND is_archived = 0"
      : "SELECT COUNT(*) as count FROM agents WHERE created_at > datetime('now', '-30 days') AND is_archived = 0"
  ).get() as any;

  const resourceStats = await db.prepare(
    "SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC"
  ).all() as any[];

  const complexityStats = await db.prepare(
    "SELECT complexity_level, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY complexity_level"
  ).all() as any[];

  const deploymentStats = await db.prepare(
    "SELECT deployment_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY deployment_type"
  ).all() as any[];

  // Tools used - use simple approach that works on both SQLite and Postgres
  let tools: any[] = [];
  try {
    tools = await db.prepare(`
      SELECT json_each.value as tool, COUNT(*) as count
      FROM agents, json_each(tools_used)
      WHERE agents.is_archived = 0
      GROUP BY tool ORDER BY count DESC LIMIT 10
    `).all() as any[];
  } catch {
    // If json_each fails, try Postgres jsonb_array_elements_text
    if (IS_POSTGRES) {
      tools = await db.prepare(`
        SELECT elem as tool, COUNT(*) as count
        FROM agents, jsonb_array_elements_text(tools_used::jsonb) as elem
        WHERE agents.is_archived = 0 AND tools_used IS NOT NULL
        GROUP BY elem ORDER BY count DESC LIMIT 10
      `).all() as any[];
    }
  }

  const contributors = await db.prepare(`
    SELECT author_github, COUNT(*) as agent_count, SUM(stars) as total_stars
    FROM agents WHERE is_archived = 0 GROUP BY author_github ORDER BY agent_count DESC, total_stars DESC LIMIT 5
  `).all() as any[];

  const mostUsedTools: Record<string, number> = {};
  for (const t of (tools || [])) mostUsedTools[t.tool] = t.count;

  return {
    total_agents: totalResult?.total || 0,
    verified_agents: totalResult?.verified || 0,
    avg_verification_score: Math.round(((totalResult?.avg_score || 0)) * 8 * 10) / 10,
    new_agents_this_month: newMonth?.count || 0,
    resource_types: resourceStats || [],
    complexity_levels: complexityStats || [],
    deployment_types: deploymentStats || [],
    most_used_tools: mostUsedTools,
    top_contributors: (contributors || []).map((c: any) => ({
      github_username: c.author_github,
      agent_count: c.agent_count,
      total_stars: c.total_stars,
    })),
  };
}
