import { Router } from 'express';
import db from '../db/pool';
import {
  sanitizeText,
  sanitizeName,
  sanitizeDescription,
  sanitizeMessage,
  sanitizeGithubUrl,
  sanitizeEmail,
} from '../utils/sanitize';

const router = Router();

const GH_TOKEN = () => process.env.GH_PAT || process.env.GITHUB_TOKEN || '';

function ghHeaders() {
  const t = GH_TOKEN();
  const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (t) h.Authorization = `token ${t}`;
  return h;
}

async function ghFetch(url: string) {
  const resp = await fetch(url, { headers: ghHeaders(), signal: AbortSignal.timeout(10000) } as RequestInit);
  return resp;
}

function summarizeReadme(readme: string, maxLen = 600): string {
  if (!readme || readme.length < 50) return '';
  const clean = readme
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const paragraphs = clean.split('\n\n').filter(p => p.trim().length > 0);
  for (const p of paragraphs) {
    const lines = p.split('\n').map(l => l.trim());
    if (lines.every(l => l.startsWith('#') || l.startsWith('[') || l.startsWith('![') || l.startsWith('|') || l.startsWith('-') || l.startsWith('*') || l.startsWith('```') || l === '')) continue;
    const cleanLines = lines
      .filter(l => !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('```') && l.length > 10)
      .map(l => l.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))
      .join(' ');
    if (cleanLines.length > 50) {
      let result = cleanLines.trim();
      if (result.length > maxLen) result = result.slice(0, result.lastIndexOf(' ', maxLen)) + '...';
      return result;
    }
  }
  return clean.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function detectResourceType(tree: string[], readme: string): { type: string; confidence: number } {
  const paths = tree.map(p => p.toLowerCase());
  const readmeLower = (readme || '').toLowerCase();

  if (paths.some(p => p.includes('skills/') || p.includes('optional-skills/')) && !paths.some(p => p.includes('agent/') || p.includes('tools/'))) {
    return { type: 'skill', confidence: 0.9 };
  }
  if (paths.some(p => p.includes('toolsets.py') || p.includes('tools/') || p.includes('model_tools.py'))) {
    return { type: 'tool', confidence: 0.85 };
  }
  if (paths.some(p => p.includes('cron/') || p.includes('workflow')) || readmeLower.includes('cron job') || readmeLower.includes('scheduled task') || readmeLower.includes('automation pipeline')) {
    return { type: 'workflow', confidence: 0.8 };
  }
  if (paths.some(p => p.includes('mcp_serve') || p.includes('mcp-')) || readmeLower.includes('mcp server') || readmeLower.includes('model context protocol')) {
    return { type: 'integration', confidence: 0.85 };
  }
  if (paths.some(p => p.includes('qdrant') || p.includes('chroma') || p.includes('vector') || p.includes('embeddings') || p.includes('memory'))) {
    return { type: 'memory-system', confidence: 0.8 };
  }
  if (paths.some(p => p.includes('router') || p.includes('gateway/')) || readmeLower.includes('query routing') || readmeLower.includes('request routing')) {
    return { type: 'router', confidence: 0.75 };
  }
  if (paths.some(p => p.includes('prompt') || p.includes('personality') || p.includes('soul.md')) || readmeLower.includes('prompt template') || readmeLower.includes('model config')) {
    return { type: 'model-config', confidence: 0.75 };
  }
  if (paths.some(p => p.includes('agent/') || p.includes('run_agent') || p.includes('cli.py')) || readmeLower.includes('autonomous agent') || readmeLower.includes('ai agent')) {
    return { type: 'agent', confidence: 0.85 };
  }
  if (readmeLower.includes('hermes')) {
    return { type: 'agent', confidence: 0.5 };
  }
  return { type: 'agent', confidence: 0.3 };
}

function extractToolsUsed(tree: string[], readme: string): string[] {
  const tools: Set<string> = new Set();
  const readmeLower = (readme || '').toLowerCase();
  const knownTools: [string, RegExp][] = [
    ['terminal', /\bterminal\b|\bshell\b|\bbash\b/],
    ['web_search', /\bweb.?search\b|\btavily\b|\bserpapi\b|\bgoogle.?search/],
    ['browser', /\bbrowser\b|\bplaywright\b|\bselenium\b|\bpuppeteer/],
    ['code_execution', /\bcode.?exec|\bpython\b.*exec|\bsandbox/],
    ['vision', /\bvision\b|\bimage.?analy/],
    ['tts', /\btext.?to.?speech|\btts\b|\belevenlabs/],
    ['memory', /\bmemory\b|\bchroma\b|\bqdrant\b|\bvector/],
    ['cronjob', /\bcron\b|\bschedule/],
    ['webhook', /\bwebhook/],
    ['delegation', /\bsub.?agent|\bdelegat/],
  ];
  const allText = tree.join(' ').toLowerCase() + ' ' + readmeLower;
  for (const [tool, regex] of knownTools) {
    if (regex.test(allText)) tools.add(tool);
  }
  return [...tools];
}

function extractTags(readme: string, repoDesc: string): string[] {
  const tags: Set<string> = new Set();
  const text = (readme + ' ' + repoDesc).toLowerCase();
  const keywords: [string, RegExp][] = [
    ['rag', /\brag\b/],
    ['automation', /\bautomat/],
    ['scraping', /\bscrap/],
    ['nlp', /\bnlp\b|natural.?language/],
    ['data-analysis', /\bdata.?analy/],
    ['code-generation', /\bcode.?gen/],
    ['multi-agent', /\bmulti.?agent/],
    ['orchestration', /\borchestr/],
    ['monitoring', /\bmonitor/],
    ['testing', /\btest/],
    ['deployment', /\bdeploy/],
    ['docker', /\bdocker/],
    ['kubernetes', /\bk8s\b|kubernetes/],
    ['telegram', /\btelegram/],
    ['discord', /\bdiscord/],
    ['slack', /\bslack/],
  ];
  for (const [tag, regex] of keywords) {
    if (regex.test(text)) tags.add(tag);
  }
  return [...tags].slice(0, 10);
}

// POST /api/submit/analyze — paste a repo URL, get auto-analyzed metadata
router.post('/analyze', async (req, res) => {
  try {
    const { repository_url } = req.body;
    if (!repository_url || typeof repository_url !== 'string') return res.status(400).json({ error: 'repository_url is required' });

    const match = repository_url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' });

    const [, owner, repo] = match;

    const existing = await db.prepare('SELECT id, slug FROM agents WHERE repository_url = ?').get(repository_url) as any;
    if (existing) return res.status(409).json({ error: 'This repo is already in the registry', existing_slug: existing.slug });

    const repoResp = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoResp.ok) return res.status(404).json({ error: `GitHub repo not found (${repoResp.status})` });
    const repoData = await repoResp.json();

    if (repoData.private) return res.status(400).json({ error: 'Cannot analyze private repositories' });

    let readme = '';
    for (const branch of ['main', 'master']) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`, {
          headers: GH_TOKEN() ? { Authorization: `token ${GH_TOKEN()}` } : {},
          signal: AbortSignal.timeout(8000),
        } as RequestInit);
        if (r.ok) { readme = await r.text(); break; }
      } catch { /* try next */ }
    }

    let hermesJson: any = null;
    try {
      const hjResp = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/contents/.hermes-eco.json`);
      if (hjResp.ok) {
        const hjData = await hjResp.json();
        hermesJson = JSON.parse(Buffer.from(hjData.content, 'base64').toString('utf-8'));
      }
    } catch { /* no hermes json */ }

    let tree: string[] = [];
    try {
      const treeResp = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch || 'main'}?recursive=1`);
      if (treeResp.ok) {
        const treeData = await treeResp.json();
        tree = (treeData.tree || []).filter((f: any) => f.type === 'blob').map((f: any) => f.path);
      }
    } catch { /* no tree */ }

    const detection = detectResourceType(tree, readme);
    const toolsUsed = extractToolsUsed(tree, readme);
    const tags = extractTags(readme, repoData.description || '');

    let longDescription = '';
    if (readme && readme.length > 100) {
      longDescription = summarizeReadme(readme, 800);
    }

    const result: Record<string, any> = {
      name: hermesJson?.name || repoData.name,
      description: hermesJson?.description || repoData.description || '',
      long_description: longDescription,
      type: hermesJson?.type || detection.type,
      type_confidence: detection.confidence,
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
      hermes_json: hermesJson,
      tools_used: toolsUsed,
      tags: tags,
      complexity_level: hermesJson?.complexity || null,
      deployment_type: hermesJson?.deployment || null,
      last_commit_date: repoData.pushed_at || null,
      open_issues: repoData.open_issues_count || 0,
      language: repoData.language || null,
      file_count: tree.length,
      key_files: tree.filter(p =>
        p.toLowerCase().includes('skill') ||
        p.toLowerCase().includes('tool') ||
        p.toLowerCase().includes('agent') ||
        p.toLowerCase().includes('workflow') ||
        p.toLowerCase().includes('cron') ||
        p.toLowerCase().includes('mcp') ||
        p.toLowerCase().includes('docker') ||
        p === 'pyproject.toml' ||
        p === 'package.json' ||
        p === 'Dockerfile' ||
        p === '.hermes-eco.json'
      ).slice(0, 20),
    };

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validate submission payload
function validateSubmission(data: any) {
  const errors: string[] = [];
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) errors.push('Name required (min 2 chars)');
  if (!data.repository || typeof data.repository !== 'string') errors.push('Repository URL required');
  if (!data.description || typeof data.description !== 'string' || data.description.length < 20) errors.push('Description required (min 20 chars)');

  const validTypes = ['agent', 'skill', 'tool', 'integration', 'workflow', 'memory-system', 'model-config', 'router'];
  const type = data.type || data.resource_type;
  if (type && !validTypes.includes(type)) errors.push(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);

  const validComplexity = ['beginner', 'intermediate', 'advanced'];
  if (data.complexity && !validComplexity.includes(data.complexity)) errors.push('Invalid complexity, use: beginner, intermediate, or advanced');

  const validDeployment = ['local', 'cloud', 'hybrid', 'docker'];
  if (data.deployment && !validDeployment.includes(data.deployment)) errors.push('Invalid deployment, use: local, cloud, hybrid, or docker');

  return errors;
}

// POST /api/submit
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Sanitize inputs
    const name = sanitizeName(data.name || '');
    const repository = data.repository ? sanitizeGithubUrl(data.repository) : null;
    const description = sanitizeDescription(data.description || '');
    const author = sanitizeName(data.author || '');
    const license = data.license ? sanitizeText(data.license, 100) : null;

    if (!name) return res.status(400).json({ error: 'Valid name required' });
    if (!repository) return res.status(400).json({ error: 'Valid repository URL required (must start with http:// or https://)' });
    if (!description || description.length < 20) return res.status(400).json({ error: 'Description required (min 20 chars)' });

    const errors = validateSubmission({ ...data, name, repository, description, author });
    if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', errors });

    const type = data.resource_type || data.type || 'agent';
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if already exists
    const existing = await db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(repository) as any;
    if (existing) return res.status(409).json({ error: 'Resource already exists in the registry', existing_id: existing.id });

    // Insert into submissions
    const result = await db.prepare(`
      INSERT INTO submissions (
        source, resource_name, resource_type, primary_category, description,
        author_github, repository_url, license, complexity, deployment, tags,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      'web_form',
      name,
      type,
      data.primary_category || null,
      description,
      author || null,
      repository,
      license || null,
      data.complexity || null,
      data.deployment || null,
      JSON.stringify(data.tags || [])
    );

    res.json({
      data: {
        id: Number(result.lastInsertRowid),
        status: 'pending',
        message: 'Submission received! Auto-verification in progress. Listed within 24 hours.',
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submit/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await db.prepare('SELECT COUNT(*) as total FROM submissions').get() as any;
    const bySource = await db.prepare('SELECT source, COUNT(*) as c FROM submissions GROUP BY source ORDER BY c DESC').all() as any[];
    const byStatus = await db.prepare('SELECT status, COUNT(*) as c FROM submissions GROUP BY status').all() as any[];
    res.json({ data: { total: total.total, by_source: bySource, by_status: byStatus } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submit/all (for admin use)
router.get('/all', async (req, res) => {
  try {
    const submissions = await db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 100').all() as any[];
    res.json({ data: submissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submit/batch (for crawler)
router.post('/batch', async (req, res) => {
  try {
    const items = req.body.items || [];
    let count = 0;

    for (const item of items) {
      const name = sanitizeName(item.name || '');
      const repoUrl = item.repository_url ? sanitizeGithubUrl(item.repository_url) : (item.repository ? sanitizeGithubUrl(item.repository) : null);
      const desc = sanitizeDescription(item.description || '');

      await db.prepare(`
        INSERT INTO submissions (
          source, resource_name, resource_type, primary_category, description,
          author_github, repository_url, license, complexity, deployment, tags,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        item.source || 'github_crawler',
        name,
        item.type || 'agent',
        item.primary_category || null,
        desc,
        sanitizeName(item.author || ''),
        repoUrl,
        item.license || null,
        item.complexity || null,
        item.deployment || null,
        JSON.stringify(item.tags || [])
      );
      count++;
    }

    res.json({ data: { submitted: count, message: `${count} submissions received` } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/submit/featured (featured request form)
router.post('/featured', async (req, res) => {
  try {
    const { resource_name, github_url, email, message } = req.body;

    // Sanitize inputs
    const cleanName = sanitizeName(resource_name || '');
    const cleanUrl = sanitizeGithubUrl(github_url || '');
    const cleanEmail = sanitizeEmail(email || '');
    const cleanMessage = sanitizeMessage(message || '');

    if (!cleanName) {
      return res.status(400).json({ error: 'Valid resource name required' });
    }
    if (!cleanUrl) {
      return res.status(400).json({ error: 'Valid GitHub URL required (must start with http:// or https://)' });
    }
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    // Check if this GitHub URL already exists in agents
    const existing = await db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(cleanUrl) as any;

    await db.prepare(
      `INSERT INTO featured_requests (resource_name, github_url, email, message, resource_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    ).run(cleanName, cleanUrl, cleanEmail, cleanMessage || null, existing?.id || null);

    res.json({ data: { message: 'Featured request received! We will review it and contact you.' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submit/featured (public: get wallet + pricing)
router.get('/featured', async (req, res) => {
  try {
    const wallet = await db.prepare("SELECT value FROM crawler_settings WHERE key = 'solana_usdc_wallet'").get() as any;
    const price = await db.prepare("SELECT value FROM crawler_settings WHERE key = 'featured_price_usdc'").get() as any;
    res.json({
      data: {
        wallet: wallet?.value || '',
        price: price?.value || '0',
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
