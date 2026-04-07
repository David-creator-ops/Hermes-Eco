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
router.post('/', (req, res) => {
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
    await const existing = db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(repository) as any;
    if (existing) return res.status(409).json({ error: 'Resource already exists in the registry', existing_id: existing.id });

    // Insert into submissions
    const result = db.prepare(`
      INSERT INTO submissions (
        source, resource_name, resource_type, primary_category, description,
        author_github, repository_url, license, complexity, deployment, tags,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    await `).run(
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
await router.get('/stats', (req, res) => {
  try {
    await const total = db.prepare('SELECT COUNT(*) as total FROM submissions').get() as any;
    await const bySource = db.prepare('SELECT source, COUNT(*) as c FROM submissions GROUP BY source ORDER BY c DESC').all() as any[];
    await const byStatus = db.prepare('SELECT status, COUNT(*) as c FROM submissions GROUP BY status').all() as any[];
    res.json({ data: { total: total.total, by_source: bySource, by_status: byStatus } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submit/all (for admin use)
await router.get('/all', (req, res) => {
  try {
    await const submissions = db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 100').all() as any[];
    res.json({ data: submissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submit/batch (for crawler)
router.post('/batch', (req, res) => {
  try {
    const items = req.body.items || [];
    let count = 0;

    const ins = db.prepare(`
      INSERT OR IGNORE INTO submissions (
        source, resource_name, resource_type, primary_category, description,
        author_github, repository_url, license, complexity, deployment, tags,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    for (const item of items) {
      const name = sanitizeName(item.name || '');
      const repoUrl = item.repository_url ? sanitizeGithubUrl(item.repository_url) : (item.repository ? sanitizeGithubUrl(item.repository) : null);
      const desc = sanitizeDescription(item.description || '');

      await ins.run(
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
router.post('/featured', (req, res) => {
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
    await const existing = db.prepare('SELECT id FROM agents WHERE repository_url = ?').get(cleanUrl) as any;

    db.prepare(
      `INSERT INTO featured_requests (resource_name, github_url, email, message, resource_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    await ).run(cleanName, cleanUrl, cleanEmail, cleanMessage || null, existing?.id || null);

    res.json({ data: { message: 'Featured request received! We will review it and contact you.' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submit/featured (public: get wallet + pricing)
await router.get('/featured', (req, res) => {
  try {
    await const wallet = db.prepare("SELECT value FROM crawler_settings WHERE key = 'solana_usdc_wallet'").get() as any;
    await const price = db.prepare("SELECT value FROM crawler_settings WHERE key = 'featured_price_usdc'").get() as any;
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
