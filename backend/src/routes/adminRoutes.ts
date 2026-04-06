import { Router, Request, Response } from 'express';
import { authenticateUser, verifyToken, auditLog, getCrawlerSetting } from '../services/adminService';
import db from '../db/pool';

const router = Router();

function requireAuth(role?: string) {
  return (req: Request, res: Response, next: Function) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired session' });
    if (role && user.role !== role && user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    (req as any).user = user;
    next();
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
router.get('/dashboard', requireAuth(), (req: Request, res: Response) => {
  try {
    const totals = db.prepare(`
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
    const bySource = db.prepare(
      "SELECT source, COUNT(*) as count FROM submissions GROUP BY source ORDER BY count DESC"
    ).all() as any[];

    // Analytics: growth — resources added per day (last 7 days)
    const dailyGrowth = db.prepare(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM agents
      WHERE is_archived = 0 AND created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY day
    `).all() as any[];

    // Analytics: top resources by stars
    const topResources = db.prepare(
      "SELECT id, name, slug, resource_type, stars, verification_status, is_featured FROM agents WHERE is_archived = 0 ORDER BY stars DESC LIMIT 5"
    ).all() as any[];

    // Analytics: verification distribution
    const verificationDist = db.prepare(`
      SELECT 
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as unverified,
        SUM(CASE WHEN verification_status = 'invalid' THEN 1 ELSE 0 END) as invalid
      FROM agents WHERE is_archived = 0
    `).get() as any;

    // Analytics: recent activity (combine submissions + crawler + user actions)
    const recentActivity = db.prepare(`
      SELECT 'submission' as type, resource_name as name, status, submitted_at as ts FROM submissions
      UNION ALL
      SELECT 'crawler' as type, status as name, status, started_at as ts FROM crawler_runs
      UNION ALL
      SELECT 'user_action' as type, action as name, al.action as status, al.created_at as ts
      FROM audit_logs al
      ORDER BY ts DESC LIMIT 15
    `).all() as any[];

    const recent = db.prepare(
      "SELECT id, resource_name, resource_type, source, status, submitted_at FROM submissions ORDER BY submitted_at DESC LIMIT 10"
    ).all() as any[];

    const crawlerRuns = db.prepare(
      "SELECT id, status, resources_found, resources_processed, started_at FROM crawler_runs ORDER BY started_at DESC LIMIT 5"
    ).all() as any[];

    const byType = db.prepare(
      "SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC"
    ).all() as any[];

    res.json({ data: { totals, recent, crawler_runs: crawlerRuns, by_type: byType, by_source: bySource, daily_growth: dailyGrowth, top_resources: topResources, verification_dist: verificationDist, recent_activity: recentActivity } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Submissions ──
router.get('/submissions', requireAuth(), (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '30');
    const offset = (page - 1) * limit;

    const where = status === 'all' ? '' : `WHERE status = ?`;
    const params: any[] = status !== 'all' ? [status] : [];
    const count = db.prepare(
      `SELECT COUNT(*) as total FROM submissions ${where}`
    ).get(...params) as { total: number };

    const submissions = db.prepare(
      `SELECT * FROM submissions ${where} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    res.json({ data: submissions, total: count.total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/approve', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id) as any;
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const slug = (submission.resource_name || '')
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    db.prepare(`
      INSERT INTO agents (
        name, slug, resource_type, type, description, author_github,
        repository_url, license, tier2_categories, complexity_level,
        deployment_type, tags, tools_used, verification_status,
        verification_score, verification_checks, stars, is_featured,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', 'verified', 0.5, '{}', 0, 0, datetime('now'), datetime('now'))
    `).run(
      submission.resource_name, slug, submission.resource_type, submission.resource_type,
      submission.description, submission.author_github || '', submission.repository_url || '',
      submission.license || 'MIT', submission.tags || '[]',
      submission.complexity_level || null, submission.deployment_type || null,
    );

    db.prepare("UPDATE submissions SET status = 'approved', verified_at = datetime('now') WHERE id = ?")
      .run(req.params.id);

    auditLog(user.id, 'approve_submission', 'submission', Number(req.params.id), { name: submission.resource_name }, req.ip || '');
    res.json({ data: { message: 'Submission approved' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:id/reject', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reason = (req.body.reason as string) || '';
    db.prepare("UPDATE submissions SET status = 'rejected', verification_details = ? WHERE id = ?")
      .run(JSON.stringify({ reason }), req.params.id);
    auditLog(user.id, 'reject_submission', 'submission', Number(req.params.id), { reason }, req.ip || '');
    res.json({ data: { message: 'Submission rejected' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Resources ──
router.get('/resources', requireAuth(), (req: Request, res: Response) => {
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

    const count = db.prepare(`SELECT COUNT(*) as total FROM agents ${where}`).get(...params) as { total: number };
    const resources = db.prepare(
      `SELECT id, name, slug, resource_type, verification_status, verification_score, stars, author_github, created_at, is_featured, is_archived FROM agents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    res.json({ data: resources, total: count.total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/toggle-featured', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    db.prepare('UPDATE agents SET is_featured = 1 - is_featured WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'toggle_featured', 'agent', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/:id/archive', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    db.prepare('UPDATE agents SET is_archived = 1 WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'archive', 'agent', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Archived' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Crawler Settings ──
router.get('/crawler/settings', requireAuth(), (req: Request, res: Response) => {
  try {
    const keys = ['github_token', 'api_base_url', 'auto_verify_threshold', 'max_resources_per_run', 'crawl_schedule'];
    const settings: Record<string, string> = {};
    for (const key of keys) {
      settings[key] = getCrawlerSetting(key) || '';
    }
    const recentRuns = db.prepare(
      "SELECT * FROM crawler_runs ORDER BY started_at DESC LIMIT 10"
    ).all() as any[];
    res.json({ data: { settings, recent_runs: recentRuns } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crawler/settings', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body.settings || {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        db.prepare(
          "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
        ).run(key, value, value);
      }
    }
    auditLog(user.id, 'update_crawler_settings', 'settings', null, { keys: Object.keys(settings) }, req.ip || '');
    res.json({ data: { message: 'Settings updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crawler/run', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const runId = db.prepare(
      "INSERT INTO crawler_runs (trigger, status) VALUES (?, 'running')"
    ).run(user.username);

    res.json({ data: { run_id: Number(runId.lastInsertRowid), message: 'Crawler started' } });

    // Run async in background
    setTimeout(async () => {
      try {
        const axios = require('axios');
        const githubToken = getCrawlerSetting('github_token') || '';
        const maxResources = parseInt(getCrawlerSetting('max_resources_per_run') || '30', 10);
        const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
        if (githubToken) headers.Authorization = `token ${githubToken}`;

        const resp = await axios.get(
          'https://api.github.com/search/code?q=filename:.hermes-eco.json&per_page=30',
          { headers, timeout: 15000 }
        );

        const items = resp.data.items || [];
        const uniqueRepos = [...new Map(items.map((i: any) => [i.repository.full_name, i])).values()];
        let processed = 0;
        let failed = 0;

        for (const item of (uniqueRepos as any[]).slice(0, maxResources)) {
          try {
            const metaResp = await axios.get(`https://api.github.com/repos/${item.repository.owner.login}/${item.repository.name}`, { headers, timeout: 10000 });
            const repo = metaResp.data;

            const existing = db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(repo.html_url) as any;
            if (existing) { processed++; continue; }

            try {
              const fileResp = await axios.get(
                `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/.hermes-eco.json`,
                { headers, timeout: 10000 }
              );
              const content = Buffer.from(fileResp.data.content, 'base64').toString('utf-8');
              const json = JSON.parse(content);

              const slug = (json.name || repo.name)
                .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

              db.prepare(`
                INSERT INTO agents (
                  name, slug, resource_type, type, description, author_github,
                  repository_url, homepage_url, license, hermes_version_required,
                  tier1_category, tier2_categories, complexity_level, deployment_type,
                  required_skills, tags, tools_used, verification_score,
                  verification_status, verification_checks, stars, forks, watchers, is_featured, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', 0.5, 'verified', '{}', ?, ?, ?, 0, datetime('now'), datetime('now'))
              `).run(
                json.name || repo.name, slug, json.type || 'agent', json.type || 'agent',
                json.description || repo.description || '', json.author || repo.owner.login,
                repo.html_url, json.homepage || null, json.license || repo.license?.spdx_id || null,
                json.hermes_version || null, json.category || null,
                JSON.stringify(json.secondary_categories || []),
                json.complexity || null, json.deployment || null,
                JSON.stringify(json.skills_required || []),
                repo.stargazers_count || 0, repo.forks_count || 0, repo.watchers_count || 0
              );
              processed++;
            } catch {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        db.prepare(
          "UPDATE crawler_runs SET status = 'completed', resources_found = ?, resources_processed = ?, resources_failed = ?, finished_at = datetime('now') WHERE id = ?"
        ).run(uniqueRepos.length, processed, failed, Number(runId.lastInsertRowid));
      } catch (err: any) {
        db.prepare(
          "UPDATE crawler_runs SET status = 'failed', resources_failed = 1, finished_at = datetime('now') WHERE id = ?"
        ).run(Number(runId.lastInsertRowid));
      }
    }, 100);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users ──
router.get('/users', requireAuth(), (req: Request, res: Response) => {
  try {
    const users = db.prepare(
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
    db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run(username, email, await hashBcrypt(password), role);
    auditLog(user.id, 'create_user', 'admin_user', null, { username, role }, req.ip || '');
    res.json({ data: { message: 'User created' } });
  } catch (err: any) {
    res.status(409).json({ error: 'Username or email already exists' });
  }
});

router.post('/users/:id/toggle-active', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    db.prepare('UPDATE admin_users SET is_active = 1 - is_active WHERE id = ?').run(req.params.id);
    auditLog(user.id, 'toggle_user_active', 'admin_user', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Updated' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Logs ──
router.get('/audit-logs', requireAuth(), (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '50');
    const logs = db.prepare(
      "SELECT al.*, au.username FROM audit_logs al LEFT JOIN admin_users au ON au.id = al.admin_id ORDER BY al.created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, (page - 1) * limit) as any[];
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings (general config in crawler_settings KV store) ──
router.get('/settings', requireAuth(), (req: Request, res: Response) => {
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
    const settings: Record<string, string> = {};
    for (const key of keys) {
      settings[key] = getCrawlerSetting(key) || '';
    }
    res.json({ data: { settings } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const settings = req.body.settings || {};
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        db.prepare(
          "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
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
router.get('/featured-requests', requireAuth(), (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'all';
    const where = status === 'all' ? '' : `WHERE status = ?`;
    const params: any[] = status !== 'all' ? [status] : [];

    const requests = db.prepare(
      `SELECT * FROM featured_requests ${where} ORDER BY created_at DESC`
    ).all(...params) as any[];

    res.json({ data: requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/approve', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const request = db.prepare('SELECT * FROM featured_requests WHERE id = ?').get(Number(req.params.id)) as any;
    if (!request) return res.status(404).json({ error: 'Request not found' });

    db.prepare(
      `UPDATE featured_requests SET status = 'approved', reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`
    ).run(user.id, Number(req.params.id));

    // If resource_id exists, mark it as featured
    if (request.resource_id) {
      db.prepare('UPDATE agents SET is_featured = 1 WHERE id = ?').run(request.resource_id);
    }

    auditLog(user.id, 'approve_featured', 'featured_request', Number(req.params.id), { resource_name: request.resource_name }, req.ip || '');
    res.json({ data: { message: 'Featured request approved' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/reject', requireAuth(), (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    db.prepare(
      `UPDATE featured_requests SET status = 'rejected', reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`
    ).run(user.id, Number(req.params.id));

    auditLog(user.id, 'reject_featured', 'featured_request', Number(req.params.id), {}, req.ip || '');
    res.json({ data: { message: 'Featured request rejected' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/featured-requests/:id/toggle-paid', requireAuth(), (req: Request, res: Response) => {
  try {
    db.prepare(
      `UPDATE featured_requests SET paid = 1 - IFNULL(paid, 0) WHERE id = ?`
    ).run(Number(req.params.id));

    res.json({ data: { message: 'Payment status toggled' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
