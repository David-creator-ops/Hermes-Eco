import db from './pool';

interface ReadmeResult {
  updated: number;
  skipped: number;
}

function summarizeReadme(readme: string, maxLen = 500): string {
  if (!readme || readme.length < 50) return readme || '';

  // Remove image badges, HTML, and clean up
  let clean = readme
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract the first meaningful text block (usually the intro description)
  const lines = clean.split('\n');
  const intro: string[] = [];
  let inIntro = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headings, badges, tables, code blocks, empty lines at start
    if (!inIntro) {
      if (!trimmed ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('[') ||
          trimmed.startsWith('|') ||
          trimmed.startsWith('```') ||
          trimmed.startsWith('---') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('-')) {
        continue;
      }
      inIntro = true;
    }

    // Stop at next heading, horizontal rule, or code block
    if (trimmed.startsWith('#') || trimmed.startsWith('---') || 
        trimmed.startsWith('```') || (trimmed.startsWith('|') && intro.length > 0)) {
      break;
    }

    // Skip empty lines in the middle of intro
    if (!trimmed) {
      if (intro.length > 0) break; // stop at first blank after getting some text
      continue;
    }

    // Remove markdown links but keep text
    const cleanLine = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    intro.push(cleanLine);

    if (intro.join(' ').length > maxLen) break;
  }

  // Fallback: take first few sentences
  if (intro.length === 0) {
    const sentences = clean.replace(/\n/g, ' ').split('. ').slice(0, 4);
    return (sentences.join('. ') + '.').trim().slice(0, maxLen);
  }

  let result = intro.join(' ').trim();
  if (result.length > maxLen) {
    result = result.slice(0, result.lastIndexOf(' ', maxLen)) + '…';
  }
  if (!result.endsWith('.')) result += '.';
  return result;
}

async function fetchReadme(owner: string, repo: string, githubToken: string): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  // Try different README file names and branches
  const attempts = [
    // Raw content API (returns raw text, not JSON)
    `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/master/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/develop/README.md`,
    // GitHub API (returns JSON with base64 content)
    `https://api.github.com/repos/${owner}/${repo}/readme`,
  ];

  for (const url of attempts) {
    try {
      const resp = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10000),
      } as RequestInit);

      if (!resp.ok) continue;

      if (url.includes('/readme')) {
        // GitHub API returns JSON with base64 encoded content
        const data = await resp.json() as any;
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        if (content && content.length > 100) return content;
      } else {
        // Raw file
        const content = await resp.text();
        if (content && content.length > 100) return content;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function fetchAndSummarize(): Promise<ReadmeResult> {
  console.log('📖 Fetching READMEs and generating summaries...\n');

  const githubToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';

  const agents = await db.prepare(
    "SELECT id, name, slug, repository_url FROM agents WHERE (long_description IS NULL OR long_description = '') AND is_archived = 0 AND repository_url LIKE '%github%'"
  ).all() as any[];

  console.log(`Found ${agents.length} agents needing README summaries\n`);

  let updated = 0;
  let skipped = 0;

  for (const agent of agents) {
    const match = agent.repository_url.match(/github\.com\/([^/]+)\/([^/?]+)/);
    if (!match) {
      console.log(`  SKIP ${agent.name}: no GitHub URL`);
      skipped++;
      continue;
    }

    const [, owner, repo] = match;
    console.log(`Fetching: ${agent.name} (${owner}/${repo})`);

    const readme = await fetchReadme(owner, repo, githubToken);

    if (readme && readme.length > 100) {
      const summary = summarizeReadme(readme);
      await db.prepare(
        "UPDATE agents SET long_description = ? WHERE id = ?"
      ).run(summary, agent.id);
      console.log(`  ✓ Summarized (${summary.length} chars)`);
      updated++;
    } else {
      console.log(`  ✗ No README content`);
      skipped++;
    }

    // Be nice to GitHub API
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped`);
  return { updated, skipped };
}
