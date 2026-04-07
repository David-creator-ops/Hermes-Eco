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
      `SELECT id, name, slug, resource_type, verification_status, verification_score, stars, author_github, created_at, is_featured, is_archived FROM agents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    res.json({ data: resources, total: count.total, page, limit });
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

    res.json({ data: { run_id: Number(runId.id), message: 'Crawler started' } });

    // Run async in background
    setTimeout(async () => {
      try {
        const axios = require('axios');
        // First try DB setting, fall back to env var
        let githubToken = (await getCrawlerSetting('github_token')) || '';
        const maxResources = parseInt((await getCrawlerSetting('max_resources_per_run')) || '30', 10);
        // If token was masked in the DB (has dots), use env var instead
        if (githubToken.includes('•')) {
          githubToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
        }
        const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
        if (githubToken) headers.Authorization = `token ${githubToken}`;

        // Strategy: search for repos by topic, keyword, or known orgs that might use Hermes
        // Also directly scan known repos from our registry
        const allItems = [];

        // 1. Search repos with hermes-related topics/keywords
        const searchQueries = [
          'topic:hermes-eco',
          'topic:hermes+topic:ai',
          'hermes+agent+registry',
          'hermes+ai+agent',
        ];

        for (const query of searchQueries) {
          try {
            const resp = await axios.get(
              `https://api.github.com/search/repos?q=${query}&sort=stars&order=desc&per_page=30`,
              { headers, timeout: 15000 }
            );
            for (const item of (resp.data.items || [])) {
              allItems.push(item);
            }
          } catch { /* skip failed queries */ }
        }

        // 2. Also scan repos from the known .hermes-eco.json repos (direct fetch)
        try {
          const codeResp = await axios.get(
            'https://api.github.com/search/code?q=filename:.hermes-eco.json&per_page=30',
            { headers, timeout: 15000 }
          );
          for (const item of (codeResp.data.items || [])) {
            // Convert code search result to repo-like object
            allItems.push(item.repository);
          }
        } catch { /* code search needs auth most of the time */ }

        // Deduplicate by full_name
        const seen = new Set();
        const uniqueRepos = [];
        for (const item of allItems) {
          const fullName = item.full_name;
          if (!seen.has(fullName) && fullName) {
            seen.add(fullName);
            uniqueRepos.push(item);
          }
        }

        let processed = 0;
        let failed = 0;

        for (const repo of (uniqueRepos as any[]).slice(0, maxResources)) {
          try {
            // Skip forks with 0 stars to avoid noise
            if (repo.fork && repo.stargazers_count < 5) continue;

            if (!repo.owner) {
              // Fetch full repo details
              const metaResp = await axios.get(`https://api.github.com/repos/${repo.full_name}`, { headers, timeout: 10000 });
              Object.assign(repo, metaResp.data);
            }

            const existing = await db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(repo.html_url) as any;
            if (existing) { processed++; continue; }

            try {
              // Try both master and main branches
              let fileResp;
              try {
                fileResp = await axios.get(
                  `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/.hermes-eco.json?${Date.now()}`,
                  { headers, timeout: 10000 }
                );
              } catch {
                // Try main branch
                fileResp = await axios.get(
                  `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/.hermes-eco.json?ref=main&${Date.now()}`,
                  { headers, timeout: 10000 }
                );
              }
              const content = Buffer.from(fileResp.data.content, 'base64').toString('utf-8');
              const json = JSON.parse(content);

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

        await db.prepare(
          "UPDATE crawler_runs SET status = 'completed', resources_found = ?, resources_processed = ?, resources_failed = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(uniqueRepos.length, processed, failed, Number(runId.lastInsertRowid));
      } catch (err: any) {
        await db.prepare(
          "UPDATE crawler_runs SET status = 'failed', resources_failed = 1, finished_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(Number(runId.lastInsertRowid));
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
