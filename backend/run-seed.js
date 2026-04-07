
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: "postgresql://postgres:ndiruljQqXTyyIfwCINitEMvbrhtcKxM@maglev.proxy.rlwy.net:37274/railway",
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    // Check if already seeded
    const check = await pool.query('SELECT COUNT(*) as c FROM admin_users');
    if (parseInt(check.rows[0].c) > 0) {
      console.log('✅ Already seeded');
      await pool.end();
      return;
    }

    // Seed admin users
    const adminHash = await bcrypt.hash('hermes2026', 12);
    const modHash = await bcrypt.hash('mod2026', 12);
    const opsHash = await bcrypt.hash('ops2026', 12);

    await pool.query("INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ['admin', 'admin@hermeseco.dev', adminHash, 'super_admin']);
    await pool.query("INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ['moderator', 'mods@hermeseco.dev', modHash, 'moderator']);
    await pool.query("INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ['ops', 'ops@hermeseco.dev', opsHash, 'analyst']);
    console.log('✅ Seeded 3 admin users');

    const resources = [
      { name: "Data Insights Agent", slug: "data-insights-agent", type: "agent", description: "AI-powered data analysis agent for SQL and CSV", author: "datawiz-dev", repo: "https://github.com/datawiz-dev/data-insights-agent", stars: 342, featured: 1 },
      { name: "Code Review Assistant", slug: "code-review-assistant", type: "agent", description: "Automated code review with security scanning", author: "codereview-ai", repo: "https://github.com/codereview-ai/code-review-assistant", stars: 412, featured: 1 },
      { name: "Free LLM Router", slug: "free-llm-router", type: "router", description: "Open-source LLM routing and load balancer", author: "terexitarius", repo: "https://github.com/terexitarius/llm-router", stars: 456, featured: 1 },
      { name: "Security Audit Agent", slug: "security-audit-agent", type: "agent", description: "Automated security scanning agent", author: "secure-ai", repo: "https://github.com/secure-ai/security-audit-agent", stars: 290, featured: 0 },
      { name: "Docker Deploy Agent", slug: "docker-deploy-agent", type: "agent", description: "Automated Docker deployment agent", author: "devops-hero", repo: "https://github.com/devops-hero/docker-deploy", stars: 267, featured: 0 },
      { name: "Test Runner Pro", slug: "test-runner-pro", type: "agent", description: "Smart test runner with Hermes integration", author: "testmaster-io", repo: "https://github.com/testmaster-io/test-runner-pro", stars: 198, featured: 1 },
      { name: "Web Scraper Skill", slug: "web-scraper-skill", type: "skill", description: "Reusable web scraping procedure for Hermes agents", author: "scraping-pro", repo: "https://github.com/scraping-pro/web-scraper", stars: 88, featured: 0 },
      { name: "Slack Integration", slug: "slack-integration", type: "integration", description: "Slack notification integration for Hermes", author: "notify-dev", repo: "https://github.com/notify-dev/slack-hermes", stars: 45, featured: 0 },
      { name: "Discord Integration", slug: "discord-integration", type: "integration", description: "Discord bot integration for Hermes agents", author: "discord-dev", repo: "https://github.com/discord-dev/hermes-discord", stars: 52, featured: 0 },
      { name: "Hermes Memory System", slug: "hermes-memory", type: "memory-system", description: "Persistent memory system for Hermes agents", author: "memory-ai", repo: "https://github.com/memory-ai/hermes-memory", stars: 73, featured: 0 },
      { name: "GPT-4 Config", slug: "gpt4-config", type: "model-config", description: "Optimized GPT-4 configuration for Hermes", author: "config-master", repo: "https://github.com/config-master/gpt4-hermes", stars: 91, featured: 0 },
      { name: "CI/CD Workflow", slug: "cicd-workflow", type: "workflow", description: "Automated CI/CD pipeline with Hermes", author: "ci-dev", repo: "https://github.com/ci-dev/hermes-cicd", stars: 34, featured: 0 },
    ];

    for (const r of resources) {
      await pool.query(
        "INSERT INTO agents (name, slug, resource_type, type, description, author_github, repository_url, verification_status, verification_score, stars, forks, watchers, is_featured, is_archived, tier2_categories, tags, tools_used) VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', 0.75, $8, 12, 34, $9, 0, '[]', '[]', '[]')",
        [r.name, r.slug, r.type, r.type, r.description, r.author, r.repo, r.stars, r.featured]
      );
    }
    console.log('✅ Seeded ' + resources.length + ' resources');

    const categories = [
      ["Automation", "automation", '⚡'],
      ["AI & ML", "ai-ml", '🧪'],
      ["Code & Development", "code-dev", '💻'],
      ["Data & Analysis", "data-analysis", '📊'],
    ];
    for (const c of categories) {
      await pool.query("INSERT INTO categories (name, slug, icon) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", c);
    }
    console.log('✅ Seeded categories');

    const settings = [
      ['github_token', ''],
      ['api_base_url', 'http://localhost:3001'],
      ['auto_verify_threshold', '0.75'],
      ['max_resources_per_run', '30'],
      ['crawl_schedule', '0 2 * * *'],
    ];
    for (const s of settings) {
      await pool.query("INSERT INTO crawler_settings (key, value) VALUES ($1, $2) ON CONFLICT DO NOTHING", s);
    }
    console.log('✅ Seeded crawler settings');

    await pool.end();
    console.log('✅ Database fully seeded!');
  } catch(e) {
    console.error('❌ Seed error:', e.message);
    await pool.end();
  }
}
seed();
