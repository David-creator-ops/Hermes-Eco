import db from '../db/pool';

export function getEcosystemStats() {
  const totalResult = db.prepare(
    "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE verification_status = 'verified') as verified, AVG(verification_score) as avg_score FROM agents WHERE is_archived = 0"
  ).get() as any;
  const newMonth = db.prepare(
    "SELECT COUNT(*) as count FROM agents WHERE created_at > datetime('now', '-30 days') AND is_archived = 0"
  ).get() as any;

  // Resource type stats
  const resourceStats = db.prepare(
    "SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC"
  ).all() as any[];

  // Use case stats
  const useCaseStats = db.prepare(`
    SELECT c.name, c.slug, c.icon, COUNT(DISTINCT a.id) as count
    FROM agents a, json_each(a.tier2_categories) as je
    JOIN categories c ON c.name = je.value
    WHERE a.is_archived = 0
    GROUP BY c.id
    ORDER BY count DESC
  `).all() as any[];

  // Complexity stats
  const complexityStats = db.prepare(
    "SELECT complexity_level, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY complexity_level"
  ).all() as any[];

  // Deployment stats
  const deploymentStats = db.prepare(
    "SELECT deployment_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY deployment_type"
  ).all() as any[];

  // Tools stats
  const tools = db.prepare(`
    SELECT json_each.value as tool, COUNT(*) as count
    FROM agents, json_each(tools_used)
    WHERE agents.is_archived = 0
    GROUP BY tool ORDER BY count DESC LIMIT 10
  `).all() as any[];

  // Contributors
  const contributors = db.prepare(`
    SELECT author_github, COUNT(*) as agent_count, SUM(stars) as total_stars
    FROM agents WHERE is_archived = 0 GROUP BY author_github ORDER BY agent_count DESC, total_stars DESC LIMIT 5
  `).all() as any[];

  const mostUsedTools: Record<string, number> = {};
  for (const t of tools) mostUsedTools[t.tool] = t.count;

  return {
    total_agents: totalResult.total || 0,
    verified_agents: totalResult.verified || 0,
    avg_verification_score: Math.round((totalResult.avg_score || 0) * 8 * 10) / 10,
    new_agents_this_month: newMonth.count,
    resource_types: resourceStats,
    use_cases: useCaseStats,
    complexity_levels: complexityStats,
    deployment_types: deploymentStats,
    most_used_tools: mostUsedTools,
    top_contributors: contributors.map((c: any) => ({
      github_username: c.author_github,
      agent_count: c.agent_count,
      total_stars: c.total_stars,
    })),
  };
}
