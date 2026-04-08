import { Router, Request, Response } from 'express';
import { authenticateUser, verifyToken, auditLog, getCrawlerSetting } from '../services/adminService';
import db from '../db/pool';

const router = Router();

function requireAuth(role?: string) {
  return async (req: Request, res: Response, next: Function) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    try {
      const user = await verifyToken(token);
      if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
      if (role && user.role !== role && user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
      (req as any).user = user;
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}

// ── Auth ──
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const result = await authenticateUser(username, password);
    if (!result) return res.status(401).json({ error: 'Invalid credentials' });
    auditLog(result.user.id, 'login', 'auth', null, {}, req.ip || '');
    res.json({ data: { token: result.token, user: result.user } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', requireAuth(), (req: Request, res: Response) => {
  res.json({ data: { user: (req as any).user } });
});

// ── Dashboard ──
router.get('/dashboard', requireAuth(), async (req: Request, res: Response) => {
  try {
    const totals = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM agents WHERE is_archived = 0) as total_resources,
        (SELECT COUNT(*) FROM submissions WHERE status = 'pending') as pending_submissions,
        (SELECT COUNT(*) FROM agents WHERE verification_status = 'verified') as verified,
        (SELECT COUNT(*) FROM crawler_runs) as total_crawls,
        (SELECT COUNT(*) FROM agents WHERE is_featured = 1) as featured_count,
        (SELECT COALESCE(AVG(stars), 0) FROM agents WHERE is_archived = 0) as avg_stars,
        (SELECT COUNT(*) FROM submissions WHERE status = 'approved') as approved_submissions,
        (SELECT COUNT(*) FROM admin_users WHERE is_active = 1) as active_users
    `).get() as any;

    // Analytics: submissions by source
    const bySource = await db.prepare(
      "SELECT source, COUNT(*) as count FROM submissions GROUP BY source ORDER BY count DESC"
    ).all() as any[];

    // Analytics: growth — resources added per day (last 7 days)
    const dailyGrowth = await db.prepare(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM agents
      WHERE is_archived = 0 AND created_at::timestamptz >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day
    `).all() as any[];

    // Analytics: top resources by stars
    const topResources = await db.prepare(
      "SELECT id, name, slug, resource_type, stars, verification_status, is_featured FROM agents WHERE is_archived = 0 ORDER BY stars DESC LIMIT 5"
    ).all() as any[];

    // Analytics: verification distribution
    const verificationDist = await db.prepare(`
      SELECT 
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as unverified,
        SUM(CASE WHEN verification_status = 'invalid' THEN 1 ELSE 0 END) as invalid
      FROM agents WHERE is_archived = 0
    `).get() as any;

    // Analytics: recent activity (combine submissions + crawler + user actions)
    const recentActivity = await db.prepare(`
      SELECT 'submission' as type, resource_name as name, status, submitted_at as ts FROM submissions
      UNION ALL
      SELECT 'crawler' as type, status as name, status, started_at as ts FROM crawler_runs
      UNION ALL
      SELECT 'user_action' as type, action as name, al.action as status, al.created_at as ts
      FROM audit_logs al
      ORDER BY ts DESC LIMIT 15
    `).all() as any[];

    const recent = await db.prepare(
      "SELECT id, resource_name, resource_type, source, status, submitted_at FROM submissions ORDER BY submitted_at DESC LIMIT 10"
    ).all() as any[];

    const crawlerRuns = await db.prepare(
      "SELECT id, status, resources_found, resources_processed, started_at FROM crawler_runs ORDER BY started_at DESC LIMIT 5"
    ).all() as any[];

    const byType = await db.prepare(
      "SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC"
    ).all() as any[];

    res.json({ data: { totals, recent, crawler_runs: crawlerRuns, by_type: byType, by_source: bySource, daily_growth: dailyGrowth, top_resources: topResources, verification_dist: verificationDist, recent_activity: recentActivity } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Submissions ──
router.get('/submissions', requireAuth(), async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '30');
    const offset = (page - 1) * limit;

    const where = status === 'all' ? '' : `WHERE status = ?`;
    const params: any[] = status !== 'all' ? [status] : [];
    const count = await db.prepare(
      `SELECT COUNT(*) as total FROM submissions ${where}`
    ).get(...params) as { total: number };

    const submissions = await db.prepare(
      `SELECT * FROM submissions ${where} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    res.json({ data: submissions, total: count.total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/approve', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const submission = await db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id) as any;
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const slug = (submission.resource_name || '')
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    await db.prepare(`
      INSERT INTO agents (
        name, slug, resource_type, type, description, author_github,
        repository_url, license, tier2_categories, complexity_level,
        deployment_type, tags, tools_used, verification_status,
        verification_score, verification_checks, stars, is_featured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', 'verified', 0.5, '{}', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      submission.resource_name, slug, submission.resource_type, submission.resource_type,
      submission.description, submission.author_github || '', submission.repository_url || '',
      submission.license || 'MIT', submission.tags || '[]',
      submission.complexity_level || null, submission.deployment_type || null,
    );

    await db.prepare("UPDATE submissions SET status = 'approved', verified_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(req.params.id);

    auditLog(user.id, 'approve_submission', 'submission', Number(req.params.id), { name: submission.resource_name }, req.ip || '');
    res.json({ data: { message: 'Submission approved' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/reject', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reason = (req.body.reason as string) || '';
    await db.prepare("UPDATE submissions SET status = 'rejected', verification_details = ? WHERE id = ?")
      .run(JSON.stringify({ reason }), req.params.id);
    auditLog(user.id, 'reject_submission', 'submission', Number(req.params.id), { reason }, req.ip || '');
    res.json({ data: { message: 'Submission rejected' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Resources ──
router.get('/resources', requireAuth(), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '30');
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    let where = 'WHERE is_archived = 0';
    let params: any[] = [];
    if (search) {
      where = 'WHERE (name LIKE ? OR author_github LIKE ?) AND is_archived = 0';
      params = [`%${search}%`, `%${search}%`];
    }

    const count = await db.prepare(`SELECT COUNT(*) as total FROM agents ${where}`).get(...params) as { total: number };
    const resources = await db.prepare(
      `SELECT id, name, slug, resource_type, verification_status, verification_score, verification_checks, stars, author_github, created_at, is_featured, is_archived, security_verdict, trust_level, security_scan FROM agents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    // Parse JSON fields
    const parsed = resources.map((r: any) => {
      try { r.verification_checks = JSON.parse(r.verification_checks || '{}'); } catch { r.verification_checks = {}; }
      try { r.security_scan = JSON.parse(r.security_scan || '[]'); } catch { r.security_scan = []; }
      return r;
    });

    res.json({ data: parsed, total: count.total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/toggle-featured', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.prepare('UPDATE agents SET is_featured = 1 - is_featured WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'toggle_featured', 'agent', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/archive', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.prepare('UPDATE agents SET is_archived = 1 WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'archive', 'agent', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Archived' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Analyze Repo (admin only) ──
router.post('/resources/analyze', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const { repository_url } = req.body;
    if (!repository_url || typeof repository_url !== 'string') return res.status(400).json({ error: 'repository_url is required' });

    const GH_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
    const ghHeaders: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (GH_TOKEN) ghHeaders.Authorization = `token ${GH_TOKEN}`;

    const match = repository_url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });
    const [, owner, repo] = match;

    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders, signal: AbortSignal.timeout(10000) } as RequestInit);
    if (!repoResp.ok) return res.status(404).json({ error: `GitHub repo not found (${repoResp.status})` });
    const repoData = await repoResp.json();
    if (repoData.private) return res.status(400).json({ error: 'Cannot analyze private repositories' });

    let readme = '';
    for (const branch of ['main', 'master']) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`, {
          headers: GH_TOKEN ? { Authorization: `token ${GH_TOKEN}` } : {},
          signal: AbortSignal.timeout(8000),
        } as RequestInit);
        if (r.ok) { readme = await r.text(); break; }
      } catch { /* try next */ }
    }

    let hermesJson: any = null;
    try {
      const hjResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.hermes-eco.json`, { headers: ghHeaders, signal: AbortSignal.timeout(5000) } as RequestInit);
      if (hjResp.ok) {
        const hjData = await hjResp.json();
        hermesJson = JSON.parse(Buffer.from(hjData.content, 'base64').toString('utf-8'));
      }
    } catch { /* no hermes json */ }

    let tree: string[] = [];
    try {
      const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch || 'main'}?recursive=1`, { headers: ghHeaders, signal: AbortSignal.timeout(8000) } as RequestInit);
      if (treeResp.ok) {
        const treeData = await treeResp.json();
        tree = (treeData.tree || []).filter((f: any) => f.type === 'blob').map((f: any) => f.path);
      }
    } catch { /* no tree */ }

    // Detect type
    const paths = tree.map(p => p.toLowerCase());
    const readmeLower = (readme || '').toLowerCase();
    let detectedType = 'agent';
    let confidence = 0.3;

    if (paths.some(p => p.includes('skills/') || p.includes('optional-skills/'))) { detectedType = 'skill'; confidence = 0.9; }
    else if (paths.some(p => p.includes('toolsets.py') || p.includes('tools/') || p.includes('model_tools.py'))) { detectedType = 'tool'; confidence = 0.85; }
    else if (paths.some(p => p.includes('cron/') || p.includes('workflow')) || readmeLower.includes('cron job') || readmeLower.includes('scheduled task')) { detectedType = 'workflow'; confidence = 0.8; }
    else if (paths.some(p => p.includes('mcp_serve') || p.includes('mcp-')) || readmeLower.includes('mcp server')) { detectedType = 'integration'; confidence = 0.85; }
    else if (paths.some(p => p.includes('qdrant') || p.includes('chroma') || p.includes('vector') || p.includes('memory'))) { detectedType = 'memory-system'; confidence = 0.8; }
    else if (paths.some(p => p.includes('router') || p.includes('gateway/'))) { detectedType = 'router'; confidence = 0.75; }
    else if (paths.some(p => p.includes('prompt') || p.includes('personality') || p.includes('soul.md'))) { detectedType = 'model-config'; confidence = 0.75; }
    else if (paths.some(p => p.includes('agent/') || p.includes('run_agent') || p.includes('cli.py')) || readmeLower.includes('autonomous agent')) { detectedType = 'agent'; confidence = 0.85; }

    // Extract tools
    const tools: Set<string> = new Set();
    const allText = tree.join(' ').toLowerCase() + ' ' + readmeLower;
    const knownTools: [string, RegExp][] = [
      ['terminal', /\bterminal\b|\bshell\b|\bbash\b/],
      ['web_search', /\bweb.?search\b|\btavily\b|\bserpapi\b/],
      ['browser', /\bbrowser\b|\bplaywright\b|\bselenium\b/],
      ['code_execution', /\bcode.?exec|\bpython\b.*exec/],
      ['vision', /\bvision\b|\bimage.?analy/],
      ['tts', /\btext.?to.?speech|\btts\b/],
      ['memory', /\bmemory\b|\bchroma\b|\bqdrant\b/],
      ['cronjob', /\bcron\b/],
    ];
    for (const [tool, regex] of knownTools) { if (regex.test(allText)) tools.add(tool); }

    // Extract tags
    const tags: Set<string> = new Set();
    const keywords: [string, RegExp][] = [
      ['rag', /\brag\b/], ['automation', /\bautomat/], ['scraping', /\bscrap/], ['nlp', /\bnlp\b/],
      ['data-analysis', /\bdata.?analy/], ['code-generation', /\bcode.?gen/], ['multi-agent', /\bmulti.?agent/],
      ['docker', /\bdocker/], ['telegram', /\btelegram/], ['discord', /\bdiscord/],
    ];
    for (const [tag, regex] of keywords) { if (regex.test(readmeLower)) tags.add(tag); }

    // Summarize readme
    let longDescription = '';
    if (readme && readme.length > 100) {
      const clean = readme.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
      const paragraphs = clean.split('\n\n').filter(p => p.trim().length > 0);
      for (const p of paragraphs) {
        const lines = p.split('\n').map(l => l.trim()).filter(l => !l.startsWith('#') && l.length > 10);
        if (lines.length > 0) {
          longDescription = lines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 800);
          break;
        }
      }
    }

    res.json({ data: {
      name: hermesJson?.name || repoData.name,
      description: hermesJson?.description || repoData.description || '',
      long_description: longDescription,
      type: hermesJson?.type || detectedType,
      type_confidence: confidence,
      type_auto_detected: !hermesJson?.type,
      author_github: hermesJson?.author || owner,
      repository_url: repository_url,
      homepage_url: hermesJson?.homepage || repoData.homepage || null,
      license: hermesJson?.license || repoData.license?.spdx_id || null,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      is_fork: repoData.fork || false,
      has_hermes_json: !!hermesJson,
      tools_used: [...tools],
      tags: [...tags],
      complexity_level: hermesJson?.complexity || null,
      deployment_type: hermesJson?.deployment || null,
      last_commit_date: repoData.pushed_at || null,
      open_issues: repoData.open_issues_count || 0,
      language: repoData.language || null,
      file_count: tree.length,
      key_files: tree.filter(p =>
        p.toLowerCase().includes('skill') || p.toLowerCase().includes('tool') ||
        p.toLowerCase().includes('agent') || p.toLowerCase().includes('workflow') ||
        p === 'pyproject.toml' || p === 'package.json' || p === 'Dockerfile' || p === '.hermes-eco.json'
      ).slice(0, 20),
    }});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /resources/add-analyzed — add analyzed repo directly to agents
router.post('/resources/add-analyzed', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const a = req.body;

    const existing = await db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(a.repository_url) as any;
    if (existing) return res.status(409).json({ error: 'This repo already exists in the registry' });

    const slug = (a.name || '')
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    await db.prepare(`
      INSERT INTO agents (
        name, slug, resource_type, type, description, long_description, author_github,
        repository_url, homepage_url, license, stars, forks, watchers,
        complexity_level, deployment_type, tags, tools_used,
        verification_status, verification_score, is_featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', 0.5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      a.name, slug, a.type, a.type,
      a.description || '', a.long_description || '', a.author_github,
      a.repository_url, a.homepage_url, a.license, a.stars || 0, a.forks || 0, a.watchers || 0,
      a.complexity_level || null, a.deployment_type || null,
      JSON.stringify(a.tags || []), JSON.stringify(a.tools_used || [])
    );

    auditLog(user.id, 'add_analyzed', 'agent', null, { name: a.name, type: a.type, repo: a.repository_url }, req.ip || '');
    res.json({ data: { message: 'Added to registry', slug } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Crawler Settings ──
router.get('/crawler/settings', requireAuth(), async (req: Request, res: Response) => {
  try {
    const keys = ['github_token', 'api_base_url', 'auto_verify_threshold', 'max_resources_per_run', 'crawl_schedule'];
    const defaults: Record<string, string> = {
      github_token: process.env.GH_PAT || process.env.GITHUB_TOKEN || '',
      api_base_url: process.env.CRAWLER_API_URL || '',
      auto_verify_threshold: '',
      max_resources_per_run: '',
      crawl_schedule: '',
    };
    const settings: Record<string, string> = {};
    for (const key of keys) {
      const dbVal = await getCrawlerSetting(key);
      settings[key] = dbVal || defaults[key] || '';
    }
    // If we loaded env var defaults but haven't saved them to DB yet, seed them now
    if (!settings.github_token && process.env.GH_PAT) {
      settings.github_token = process.env.GH_PAT;
    }
    if (!settings.api_base_url && process.env.CRAWLER_API_URL) {
      settings.api_base_url = process.env.CRAWLER_API_URL;
    }
    // Save non-secret defaults to DB so they persist
    if (settings.api_base_url && !(await getCrawlerSetting('api_base_url'))) {
      await db.prepare(
        "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO NOTHING"
      ).run('api_base_url', settings.api_base_url);
    }
    // Return raw token for form handling (UI masks it)
    // Send raw env var separately for form default (cjs crawler run uses env directly, not this response)
    const hasEnvToken = !!(process.env.GH_PAT || process.env.GITHUB_TOKEN);
    const hasEnvApiUrl = !!process.env.CRAWLER_API_URL;
    // Raw env values for form defaults (masked in UI via the frontend)
    const envToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
    const recentRuns = await db.prepare(
      "SELECT * FROM crawler_runs ORDER BY started_at DESC LIMIT 10"
    ).all() as any[];
    res.json({ data: { settings, recent_runs: recentRuns, has_env_token: hasEnvToken, has_env_api_url: hasEnvApiUrl } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crawler/settings', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body.settings || {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        await db.prepare(
          "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP"
        ).run(key, value, value);
      }
    }
    auditLog(user.id, 'update_crawler_settings', 'settings', null, { keys: Object.keys(settings) }, req.ip || '');
    res.json({ data: { message: 'Settings updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crawler/run', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const runId = await db.prepare(
      "INSERT INTO crawler_runs (trigger, status) VALUES (?, 'running') RETURNING id"
    ).get(user.username);

    // Run async in background
    setTimeout(async () => {
      try {
        const axios = require('axios');
        // STRICT: must use env var GH_PAT for code search (requires token >= 300 stars)
        const githubToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
        const maxResources = parseInt((await getCrawlerSetting('max_resources_per_run')) || '30', 10);

        if (!githubToken || githubToken.length < 30) {
          await db.prepare(
            "UPDATE crawler_runs SET status = 'failed', details = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).run(JSON.stringify({ error: 'GH_PAT env var required for code search. Add GH_PAT to Railway env vars.' }), Number(runId.id));
          return;
        }

        const headers: Record<string, string> = {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        };

        // STRICT: ONLY find repos that have .hermes-eco.json file
        // This is the ONLY way to know a repo belongs to Hermes Eco
        let allItems: any[] = [];
        try {
          const resp = await axios.get(
            `https://api.github.com/search/code?q=filename:.hermes-eco.json&per_page=30`,
            { headers, timeout: 15000 }
          );
          allItems = resp.data.items || [];
        } catch (e: any) {
          await db.prepare(
            "UPDATE crawler_runs SET status = 'failed', details = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).run(JSON.stringify({ error: `GitHub code search failed: ${e.response?.status} ${e.response?.data?.message || e.message}` }), Number(runId.id));
          return;
        }

        // Deduplicate repos
        const seen = new Map<string, any>();
        for (const item of allItems) {
          const repo = item.repository;
          if (repo && !seen.has(repo.full_name)) {
            seen.set(repo.full_name, repo);
          }
        }
        const uniqueRepos = [...seen.values()].slice(0, maxResources);

        let processed = 0;
        let failed = 0;

        for (const repo of uniqueRepos) {
          try {
            const existing = await db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(repo.html_url) as any;
            if (existing) continue; // already have this

            // Fetch the .hermes-eco.json content
            const fileResp = await axios.get(
              `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/.hermes-eco.json`,
              { headers, timeout: 10000 }
            );

            const content = Buffer.from(fileResp.data.content, 'base64').toString('utf-8');
            const json = JSON.parse(content);

            // STRICT VALIDATION: must be a valid Hermes resource
            const validTypes = ['agent', 'skill', 'tool', 'workflow', 'integration', 'memory', 'router', 'config'];
            if (!json.type || !validTypes.includes(json.type)) continue;
            if (!json.description) continue;
            if (!json.name && !repo.name) continue;

            // Fetch repo metadata for stars etc
            const repoResp = await axios.get(repo.url, { headers, timeout: 10000 });
            const repoData = repoResp.data;

            const slug = (json.name || repo.name)
              .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

            await db.prepare(`
              INSERT INTO agents (
                name, slug, resource_type, type, description, author_github,
                repository_url, homepage_url, license, hermes_version_required,
                tier1_category, tier2_categories, complexity_level, deployment_type,
                required_skills, tags, tools_used, verification_score,
                verification_status, verification_checks, stars, forks, watchers, is_featured, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', 0.5, 'verified', '{}', ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).run(
              json.name || repo.name, slug,
              json.type, json.type,
              json.description || repo.description || '', json.author || repoData.owner?.login || repo.owner.login,
              repo.html_url, json.homepage || null, json.license || repoData.license?.spdx_id || null,
              json.hermes_version || null, json.category || null,
              JSON.stringify(json.secondary_categories || []),
              json.complexity || null, json.deployment || null,
              JSON.stringify(json.skills_required || []),
              repoData.stargazers_count || 0, repoData.forks_count || 0, repoData.watchers_count || 0
            );
            processed++;
          } catch (err: any) {
            console.log(`  Skip ${repo?.full_name || 'unknown'}: ${err.message?.slice(0, 100)}`);
            failed++;
          }
        }

        await db.prepare(
          "UPDATE crawler_runs SET status = 'completed', resources_found = ?, resources_processed = ?, resources_failed = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(uniqueRepos.length, processed, failed, Number(runId.id));
      } catch (err: any) {
        await db.prepare(
          "UPDATE crawler_runs SET status = 'failed', details = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(JSON.stringify({ error: err.message }), Number(runId.id));
        console.error('Crawler run failed:', err.message);
      }
    }, 100);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users ──
router.get('/users', requireAuth(), async (req: Request, res: Response) => {
  try {
    const users = await db.prepare(
      "SELECT id, username, email, role, is_active, last_login, created_at FROM admin_users ORDER BY created_at"
    ).all() as any[];
    res.json({ data: users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { username, email, role, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!['super_admin', 'moderator', 'analyst'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const { hashBcrypt } = require('../services/adminService');
    await db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(username, email, await hashBcrypt(password), role);
    auditLog(user.id, 'create_user', 'admin_user', null, { username, role }, req.ip || '');
    res.json({ data: { message: 'User created' } });
  } catch (err: any) {
    res.status(409).json({ error: 'Username or email already exists' });
  }
});

router.post('/users/:id/toggle-active', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.prepare('UPDATE admin_users SET is_active = 1 - is_active WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'toggle_user_active', 'admin_user', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Logs ──
router.get('/audit-logs', requireAuth(), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const logs = await db.prepare(
      "SELECT al.*, au.username FROM audit_logs al LEFT JOIN admin_users au ON au.id = al.admin_id ORDER BY al.created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, (page - 1) * limit) as any[];
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fetch READMEs ──
router.post('/fetch-readmes', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fetchAndSummarize } = require('../db/fetch-readmes');
    const { updated, skipped } = await fetchAndSummarize();
    auditLog(user.id, 'fetch_readmes', 'admin', null, { updated }, req.ip || '');
    res.json({ data: { message: `Updated ${updated} READMEs, ${skipped} skipped` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Verify & Enrich Agents ──
router.post('/verify-agents', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { verifyAndEnrich } = require('../db/verify-agents');
    const { updated } = await verifyAndEnrich();
    auditLog(user.id, 'verify_agents', 'admin', null, { updated }, req.ip || '');
    res.json({ data: { message: `Verified and enriched ${updated} agents` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Security Scan ──
router.post('/security-scan', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { runSecurityVerification } = require('../db/security-scan');
    const { updated, dangers } = await runSecurityVerification();
    auditLog(user.id, 'security_scan', 'admin', null, { scanned: updated, dangers }, req.ip || '');
    res.json({ data: { message: `Security scan complete: ${updated} scanned, ${dangers} dangerous` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Single Resource Security Scan ──
router.post('/resources/:id/security-scan', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const agent = await db.prepare('SELECT id, name, repository_url FROM agents WHERE id = ?').get(req.params.id) as any;
    if (!agent) return res.status(404).json({ error: 'Resource not found' });

    const match = agent.repository_url.match(/github\.com\/([^/]+)\/([^/?]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });
    const [, owner, repo] = match;

    const ghToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
    const { securityScanRepository } = require('../db/security-scan');
    const result = await securityScanRepository(owner, repo, ghToken);

    await db.prepare(
      "UPDATE agents SET security_scan = ?, security_verdict = ?, trust_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(
      JSON.stringify(result.findings),
      result.verdict,
      result.trust_level,
      agent.id
    );

    res.json({ data: { verdict: result.verdict, findings: result.findings, trust_level: result.trust_level } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Categories CRUD ──
router.get('/categories', requireAuth('super_admin'), async (req: Request, res: Response) => {
  const categories = await db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ data: categories });
});

router.post('/categories', requireAuth('super_admin'), async (req: Request, res: Response) => {
  const { name, slug, type, description, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });

  const existing = await db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (existing) return res.status(409).json({ error: 'Category already exists' });

  const result = await db.prepare(
    'INSERT INTO categories (name, slug, type, description, icon) VALUES (?, ?, ?, ?, ?)'
  ).run(name, slug, type || 'usecase', description || '', icon || '');

  res.json({ data: { id: result.lastInsertRowid, name, slug, type, description, icon } });
});

router.put('/categories/:id', requireAuth('super_admin'), async (req: Request, res: Response) => {
  const { name, slug, type, description, icon } = req.body;
  await db.prepare(
    'UPDATE categories SET name = ?, slug = ?, type = ?, description = ?, icon = ? WHERE id = ?'
  ).run(name, slug, type, description, icon, req.params.id);
  res.json({ data: { message: 'Updated' } });
});

router.delete('/categories/:id', requireAuth('super_admin'), async (req: Request, res: Response) => {
  await db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ data: { message: 'Deleted' } });
});

// ── Seed DB ──
router.post('/seed', requireAuth('super_admin'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { seedDatabase } = require('../db/seed');
    const inserted = await seedDatabase();
    auditLog(user.id, 'seed_db', 'db', null, { inserted }, req.ip || '');
    res.json({ data: { message: `Seeded ${inserted} agents` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Change Password ──
router.post('/auth/change-password', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Current and new password required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const bcrypt = require('bcryptjs');
    const existing = await db.prepare('SELECT password_hash FROM admin_users WHERE id = ?').get(user.id) as any;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(current_password, existing.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 12);
    await db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    auditLog(user.id, 'change_password', 'auth', user.id, {}, req.ip || '');
    res.json({ data: { message: 'Password changed successfully' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings (general config in crawler_settings KV store) ──
router.get('/settings', requireAuth(), async (req: Request, res: Response) => {
  try {
    const keys = [
      'solana_usdc_wallet',
      'featured_price_usdc',
      'site_name',
      'site_tagline',
      'hero_title_line1',
      'hero_title_line2',
      'hero_description',
      'cta_title',
      'cta_description',
      'cta_file_name',
      'crawler_schedule',
      'max_crawl_results',
      'github_token',
      'auto_verify_threshold',
    ];
    const settings: Record<string, any> = {};
    for (const key of keys) {
      settings[key] = (await getCrawlerSetting(key)) || '';
    }
    res.json({ data: { settings } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body.settings || {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        await db.prepare(
          "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP"
        ).run(key, value, value);
      }
    }
    auditLog(user.id, 'update_settings', 'settings', null, { keys: Object.keys(settings) }, req.ip || '');
    res.json({ data: { message: 'Settings updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Featured Requests ──
router.get('/featured-requests', requireAuth(), async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'all';
    const where = status === 'all' ? '' : `WHERE status = ?`;
    const params: any[] = status !== 'all' ? [status] : [];

    const requests = await db.prepare(
      `SELECT * FROM featured_requests ${where} ORDER BY created_at DESC`
    ).all(...params) as any[];

    res.json({ data: requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/approve', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const request = await db.prepare('SELECT * FROM featured_requests WHERE id = ?').get(Number(req.params.id)) as any;
    if (!request) return res.status(404).json({ error: 'Request not found' });

    await db.prepare(
      `UPDATE featured_requests SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE id = ?`
    ).run(user.id, Number(req.params.id));

    // If resource_id exists, mark it as featured
    if (request.resource_id) {
      await db.prepare('UPDATE agents SET is_featured = 1 WHERE id = ?').run(request.resource_id);
    }

    auditLog(user.id, 'approve_featured', 'featured_request', Number(req.params.id), { resource_name: request.resource_name }, req.ip || '');
    res.json({ data: { message: 'Featured request approved' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/reject', requireAuth(), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await db.prepare(
      `UPDATE featured_requests SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE id = ?`
    ).run(user.id, Number(req.params.id));

    auditLog(user.id, 'reject_featured', 'featured_request', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Featured request rejected' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/toggle-paid', requireAuth(), async (req: Request, res: Response) => {
  try {
    await db.prepare(
      `UPDATE featured_requests SET paid = 1 - COALESCE(paid, 0) WHERE id = ?`
    ).run(Number(req.params.id));

    res.json({ data: { message: 'Payment status toggled' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
