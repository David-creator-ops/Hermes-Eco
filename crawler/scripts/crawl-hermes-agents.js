/**
 * Hermes Registry Crawler
 * Searches GitHub for .hermes-eco.json files, verifies them,
 * and posts them to the registry API.
 *
 * Run: node scripts/crawl-hermes-agents.js
 */

const axios = require('axios');

const GH_PAT = process.env.GH_PAT || '';
const CRAWLER_API_URL = process.env.CRAWLER_API_URL || 'http://localhost:3001';

const VERIFICATION_CHECKS = [
  { key: 'has_hermes_dependency', label: 'Has Hermes dependency' },
  { key: 'has_hermes_import', label: 'Uses Hermes imports in code' },
  { key: 'readme_mentions_hermes', label: 'README mentions Hermes' },
  { key: 'has_valid_metadata', label: 'Valid .hermes-eco.json metadata' },
  { key: 'not_a_fork', label: 'Original repository (not a fork)' },
  { key: 'has_tests', label: 'Has tests' },
  { key: 'has_license', label: 'Has license file' },
  { key: 'readme_detailed', label: 'README has installation & usage instructions' },
];

async function githubRequest(url) {
  try {
    const resp = await axios.get(url, {
      headers: {
        Authorization: `token ${GH_PAT}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 15000,
    });
    return resp.data;
  } catch (err) {
    console.error(`  GitHub API error for ${url}: ${err.message}`);
    return null;
  }
}

function searchHermesRegistryFiles(page = 1) {
  const query = 'filename:.hermes-eco.json path:/';
  return githubRequest(
    `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`
  );
}

async function getFileContent(repoUrl, path) {
  // Convert github.com repo to API url
  const matches = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!matches) return null;
  const [, owner, repo] = matches;
  const repoData = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  if (!repoData || !repoData.content) return null;
  return Buffer.from(repoData.content, 'base64').toString('utf-8');
}

async function getRepoData(repoUrl) {
  const matches = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!matches) return null;
  const [, owner, repo] = matches;
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}`);
}

function parseMetadata(content) {
  try {
    const parsed = JSON.parse(content);
    return {
      valid: true,
      data: parsed,
    };
  } catch {
    return { valid: false, data: null };
  }
}

async function checkHermesDependency(repoUrl) {
  // Check requirements.txt
  const reqContent = await getFileContent(repoUrl, 'requirements.txt');
  if (reqContent && reqContent.toLowerCase().includes('hermes')) return true;

  // Check pyproject.toml
  const pyproject = await getFileContent(repoUrl, 'pyproject.toml');
  if (pyproject && /hermes[-_]?agent/i.test(pyproject)) return true;

  // Check package.json
  const pkgContent = await getFileContent(repoUrl, 'package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (
        (pkg.dependencies && pkg.dependencies['hermes-agent']) ||
        (pkg.devDependencies && pkg.devDependencies['hermes-agent'])
      ) return true;
    } catch {}
  }

  return false;
}

async function checkHermesImports(repoUrl) {
  // Check main Python files for Hermes imports
  const checks = ['src/agent.py', 'src/main.py', 'agent.py', 'main.py', 'src/index.ts', 'index.ts'];
  for (const file of checks) {
    const content = await getFileContent(repoUrl, file);
    if (content) {
      if (
        /from\s+hermes_agent\s+import/i.test(content) ||
        /HermesAgent/i.test(content) ||
        /from\s+['"]hermes/i.test(content) ||
        /hermes-agent/i.test(content) ||
        /import.*hermes/i.test(content)
      ) return true;
    }
  }
  return false;
}

async function checkReadmeMentionsHermes(repoUrl) {
  const readme = await getFileContent(repoUrl, 'README.md');
  if (!readme) return false;
  return /hermes/i.test(readme);
}

async function checkHasTests(repoUrl) {
  const testDirs = ['tests/', 'test/', '__tests__/'];
  for (const dir of testDirs) {
    const result = await githubRequest(
      `https://api.github.com/repos/${repoUrl.split('/').slice(-2).join('/')}/contents/${dir}`
    );
    if (result && Array.isArray(result)) return true;
  }
  return false;
}

async function checkHasLicense(repoUrl) {
  const matches = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!matches) return false;
  const [, owner, repo] = matches;
  const data = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/license`);
  return !!data;
}

async function checkReadmeDetailed(repoUrl) {
  const readme = await getFileContent(repoUrl, 'README.md');
  if (!readme) return false;
  const hasInstallation = /install/i.test(readme);
  const hasUsage = /usage|quickstart|getting.started|example/i.test(readme);
  return hasInstallation || hasUsage;
}

async function verifyAgent(repoUrl, metadata) {
  const checks = {};

  // 1. Valid metadata
  checks.has_valid_metadata = metadata && metadata.valid;

  // 2. Not a fork
  const repoData = await getRepoData(repoUrl);
  checks.not_a_fork = repoData ? !repoData.fork : false;

  // 3. Has Hermes dependency
  checks.has_hermes_dependency = await checkHermesDependency(repoUrl);

  // 4. Has Hermes imports
  checks.has_hermes_import = await checkHermesImports(repoUrl);

  // 5. README mentions Hermes
  checks.readme_mentions_hermes = await checkReadmeMentionsHermes(repoUrl);

  // 6. Has tests
  checks.has_tests = await checkHasTests(repoUrl);

  // 7. Has license
  checks.has_license = await checkHasLicense(repoUrl);

  // 8. README detailed
  checks.readme_detailed = await checkReadmeDetailed(repoUrl);

  const passed = Object.values(checks).filter(Boolean).length;
  const total = VERIFICATION_CHECKS.length;
  const score = passed / total;

  const status = score >= 0.75 ? 'verified' : score >= 0.5 ? 'unverified' : 'rejected';

  return { checks, score, status, passed, total };
}

function getSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('Starting Hermes Registry Crawler...');
  console.log(`API: ${CRAWLER_API_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  if (!GH_PAT) {
    console.error('ERROR: GH_PAT environment variable is not set.');
    process.exit(1);
  }

  let totalFound = 0;
  let processed = 0;
  let failed = 0;

  for (let page = 1; page <= 3; page++) {
    console.log(`\nSearching GitHub page ${page}...`);
    const searchResult = await searchHermesRegistryFiles(page);

    if (!searchResult || !searchResult.items) {
      console.log('No more results or rate limited.');
      break;
    }

    // Group by repository (avoid duplicates)
    const repos = {};
    for (const item of searchResult.items) {
      const repoUrl = item.repository.html_url;
      if (!repos[repoUrl]) {
        repos[repoUrl] = item.repository;
      }
    }

    console.log(`Found ${Object.keys(repos).length} unique repositories on page ${page}`);

    for (const [repoUrl, repoData] of Object.entries(repos)) {
      totalFound++;
      console.log(`\nProcessing: ${repoUrl}`);

      try {
        // Fetch metadata
        const metaContent = await getFileContent(repoUrl, '.hermes-eco.json');
        if (!metaContent) {
          console.log('  No .hermes-eco.json found (false positive from search)');
          continue;
        }

        const metadata = parseMetadata(metaContent);
        if (!metadata.valid) {
          console.log('  Invalid JSON in .hermes-eco.json');
          continue;
        }

        // Verify
        console.log('  Running verification checks...');
        const verification = await verifyAgent(repoUrl, metadata);
        console.log(`  Score: ${verification.passed}/${verification.total} -> ${verification.status}`);

        // Build agent entry
        const md = metadata.data;
        const agentEntry = {
          name: md.name || repoData.name,
          slug: getSlug(md.name || repoData.name),
          type: md.type || 'agent',
          description: md.description || repoData.description || '',
          long_description: md.long_description,
          author_github: md.author || repoData.owner.login,
          repository_url: repoUrl,
          homepage_url: md.homepage,
          license: md.license || null,
          hermes_version_required: md.hermes_version,
          tags: md.tags || [],
          tools_used: md.tools_used || [],
          icon_url: md.icon_url,
          banner_url: md.banner_url,
          verification_score: verification.score,
          verification_status: verification.status,
          verification_checks: verification.checks,
          stars: repoData.stargazers_count || 0,
          forks: repoData.forks_count || 0,
          watchers: repoData.watchers_count || 0,
          last_commit_date: repoData.updated_at || null,
        };

        // Post to API
        const resp = await axios.post(`${CRAWLER_API_URL}/api/crawler/upsert`, agentEntry, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        console.log(`  API response: ${resp.data.message || 'OK'}`);
        processed++;
      } catch (err) {
        console.error(`  Failed to process ${repoUrl}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log('\n=== Crawl Complete ===');
  console.log(`Total repos found: ${totalFound}`);
  console.log(`Successfully processed: ${processed}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
