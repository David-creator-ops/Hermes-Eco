import db from './pool';

// Verifies seed agents by fetching real GitHub data
// Updates: long_description (from README), verification checks, real repo stats
async function fetchWithTimeout(url: string, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

function summarizeReadme(text: string, maxLen = 600): string {
  // Remove badges, images, HTML tags, nav links
  const clean = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')           // images
    .replace(/<img[^>]*>/gi, '')                       // img tags
    .replace(/\[[^\]]*\]\(#[^)]*\)/g, '')              // anchor links
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract first meaningful paragraph (skip badges, shields, empty lines)
  const paragraphs = clean.split('\n\n').filter(p => p.trim().length > 0);
  let summary = '';
  for (const p of paragraphs) {
    const lines = p.split('\n').map(l => l.trim());
    // Skip badge shields, headers, empty
    if (lines.every(l =>
      l.startsWith('#') || l.startsWith('[') || l.startsWith('![') ||
      l.startsWith('|') || l.startsWith('-') || l.startsWith('*') ||
      l.startsWith('```') || l === ''
    )) continue;

    const cleanLines = lines
      .filter(l => !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('```') && l.length > 10)
      .map(l => l.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))  // remove links, keep text
      .join(' ');
    
    if (cleanLines.length > 50) {
      summary = cleanLines;
      break;
    }
  }

  if (!summary) {
    // Last resort: first substantial sentence
    summary = clean.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/\. /g, '.\n').split('\n').find(s => s.length > 80) || '';
    // Remove markdown artifacts
    summary = summary.replace(/[#*_`~]/g, '').trim();
  }

  if (summary.length > maxLen) {
    summary = summary.slice(0, summary.lastIndexOf(' ', maxLen)) + '…';
  }
  return summary;
}

export async function verifyAndEnrich(): Promise<{ updated: number }> {
  console.log('🔍 Verifying and enriching agents with real GitHub data...\n');
  const ghToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (ghToken) headers.Authorization = `token ${ghToken}`;

  const agents = await (db as any).prepare(
    "SELECT id, name, repository_url, long_description, verification_score FROM agents WHERE is_archived = 0 AND repository_url IS NOT NULL"
  ).all() as any[];

  console.log(`Checking ${agents.length} agents...\n`);
  let updated = 0;

  for (const agent of agents) {
    const match = agent.repository_url.match(/github\.com\/([^/]+)\/([^/?]+)/);
    if (!match) {
      console.log(`  SKIP ${agent.name}: not a GitHub repo`);
      continue;
    }
    const [, owner, repo] = match;
    console.log(`→ ${agent.name} (${owner}/${repo})`);

    // Fetch repo metadata
    let repoMeta: any = null;
    try {
      const r = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers } as RequestInit);
      if (r.ok) repoMeta = await r.json();
    } catch (e: any) {
      console.error(`  API error: ${e.message}`);
    }

    // Fetch README
    let readme: string | null = null;
    for (const [branch, name] of [['master', 'README.md'], ['main', 'README.md'], ['master', 'README'], ['main', 'README']]) {
      try {
        const r = await fetchWithTimeout(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${name}`);
        if (r.ok) {
          readme = await r.text();
          break;
        }
      } catch { /* try next */ }
    }

    if (!repoMeta && !readme) {
      console.log(`  ✗ Could not access repo`);
      continue;
    }

    // Generate verification
    const readmeLower = (readme || '').toLowerCase();
    const checks: Record<string, boolean> = {
      has_repository: !!repoMeta,
      has_readme: !!readme,
      has_tests: readmeLower.includes('test') || readmeLower.includes('jest') || readmeLower.includes('py.test') || readmeLower.includes('cypress'),
      has_license: readmeLower.includes('license') || !!(repoMeta?.license),
      has_contributing: readmeLower.includes('contributing') || readmeLower.includes('contribute'),
      active_repo: !!(repoMeta && (repoMeta.pushed_at ? (Date.now() - new Date(repoMeta.pushed_at).getTime() < 365 * 24 * 60 * 60 * 1000) : true)),
      has_releases: !!(repoMeta?.releases_url),
      has_discussions: readmeLower.includes('discuss') || readmeLower.includes('forum') || readmeLower.includes('community'),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const score = parseFloat((passed / 8).toFixed(2));

    // Generate long_description from README summary
    let longDesc: string | null = null;
    if (readme && readme.length > 200) {
      longDesc = summarizeReadme(readme, 800);
    }

    // Update
    await (db as any).prepare(
      "UPDATE agents SET verification_score = $1, verification_checks = $2, stars = $3, forks = $4, watchers = $5, long_description = COALESCE(NULLIF($6, ''), long_description), updated_at = CURRENT_TIMESTAMP WHERE id = $7"
    ).run(
      score,
      JSON.stringify(checks),
      repoMeta?.stargazers_count ?? 0,
      repoMeta?.forks_count ?? 0,
      repoMeta?.watchers_count ?? 0,
      longDesc,
      agent.id
    );

    console.log(`  ✓ verification: ${passed}/8 (${score}) | stars: ${repoMeta?.stargazers_count ?? 0}`);
    if (longDesc) console.log(`  ✓ description: ${longDesc.length} chars from README`);
    updated++;

    // Be nice to GitHub API
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ ${updated} agents verified and enriched`);
  return { updated };
}
