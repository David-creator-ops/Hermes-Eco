import db from './pool';

// Clear
db.prepare("DELETE FROM resource_relationships").run();
db.prepare("DELETE FROM agent_categories").run();
db.prepare("DELETE FROM categories").run();
db.prepare("DELETE FROM agents").run();
db.prepare("DELETE FROM sqlite_sequence").run();

// Categories
const ALL_CATS = [
  // Resource types
  { name: 'Agents', slug: 'agents', type: 'resource', desc: 'Autonomous AI systems', icon: '🤖' },
  { name: 'Skills', slug: 'skills', type: 'resource', desc: 'Reusable procedures', icon: '🛠️' },
  { name: 'Tools', slug: 'tools', type: 'resource', desc: 'Utilities', icon: '🔧' },
  { name: 'Integrations', slug: 'integrations', type: 'resource', desc: 'External services', icon: '🔌' },
  { name: 'Workflows', slug: 'workflows', type: 'resource', desc: 'Automation recipes', icon: '⚙️' },
  { name: 'Memory Systems', slug: 'memory-systems', type: 'resource', desc: 'Knowledge bases', icon: '🧠' },
  { name: 'Model Configs', slug: 'model-configs', type: 'resource', desc: 'Prompt templates', icon: '🎯' },
  { name: 'Routers', slug: 'routers', type: 'resource', desc: 'Orchestration', icon: '🔄' },
  // Use cases
  { name: 'Data & Analysis', slug: 'data-analysis', type: 'usecase', desc: 'Data processing', icon: '📊' },
  { name: 'Automation', slug: 'automation', type: 'usecase', desc: 'Task automation', icon: '⚡' },
  { name: 'Code & Development', slug: 'code-dev', type: 'usecase', desc: 'Development', icon: '💻' },
  { name: 'Web & Browser', slug: 'web-browser', type: 'usecase', desc: 'Web interaction', icon: '🌐' },
  { name: 'Content & Writing', slug: 'content', type: 'usecase', desc: 'Content gen', icon: '✍️' },
  { name: 'DevOps & Infra', slug: 'devops', type: 'usecase', desc: 'Infrastructure', icon: '🔧' },
  { name: 'Communication', slug: 'communication', type: 'usecase', desc: 'Messaging', icon: '💬' },
  { name: 'Security', slug: 'security', type: 'usecase', desc: 'Security tools', icon: '🔐' },
  { name: 'AI & ML', slug: 'ai-ml', type: 'usecase', desc: 'ML tools', icon: '🧪' },
  { name: 'Research', slug: 'research', type: 'usecase', desc: 'Research', icon: '🔍' },
  { name: 'Enterprise', slug: 'enterprise', type: 'usecase', desc: 'Business', icon: '🏢' },
  { name: 'Creative', slug: 'creative', type: 'usecase', desc: 'Creative', icon: '🎨' },
];

const catMap: Record<string, number> = {};
const insCat = db.prepare('INSERT INTO categories (name, slug, type, description, icon) VALUES (?,?,?,?,?)');
for (const c of ALL_CATS) {
  const r = insCat.run(c.name, c.slug, c.type, c.desc, c.icon);
  catMap[c.slug] = Number(r.lastInsertRowid);
}

// Resources
const RES = [
  {
    name:'Data Insights Agent', slug:'data-insights-agent',
    resource_type:'agent', type:'agent',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['Data & Analysis','AI & ML'],
    description:'Analyzes CSV/JSON data, generates statistical reports, and creates visual charts automatically.',
    long_description:'A powerful data analysis agent that connects to your datasets and performs exploratory data analysis using pandas, matplotlib, and seaborn.',
    author_github:'datawiz-dev', repository_url:'https://github.com/datawiz-dev/data-insights-agent',
    homepage_url:'https://data-insights-demo.vercel.app', license:'MIT', hermes:'>=1.0.0',
    tags:['data-analysis','csv','python'], tools:['terminal','file','code_execution'],
    vs:'verified', v_score:0.875, stars:342, forks:48, watchers:23, featured:1,
    complexity:'Intermediate', deploy:'Local', skills:['Python','Data science'], deps:['pandas','matplotlib','seaborn'],
  },
  {
    name:'Test Runner Pro', slug:'test-runner-pro',
    resource_type:'agent', type:'agent',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['Code & Development','Automation'],
    description:'Automatically discovers, runs, and reports on test suites. Supports pytest, Jest, and more.',
    long_description:'A development workflow agent that finds test files, runs them in parallel, collects results, and generates test reports with coverage data.',
    author_github:'testmaster-io', repository_url:'https://github.com/testmaster-io/test-runner-pro',
    license:'MIT', hermes:'>=1.0.0',
    tags:['testing','ci-cd','jest'], tools:['terminal','file','web_search'],
    vs:'verified', v_score:1.0, stars:189, forks:31, watchers:12, featured:1,
    complexity:'Beginner', deploy:'Local', skills:['Python','Testing'], deps:['pytest'],
  },
  {
    name:'Free LLM Router', slug:'free-llm-router',
    resource_type:'router', type:'router',
    tier1_category:'ROUTERS & ORCHESTRATION', tier1_subcategory:'Model routers',
    tier2:['AI & ML','Automation'],
    description:'Route requests to free and cheap LLM providers with load balancing and fallback logic.',
    long_description:'Smart routing system for model selection based on cost, availability, and capability. Supports OpenRouter free tier and local models with cost tracking.',
    author_github:'terexitarius', repository_url:'https://github.com/terexitarius/free-llm-router',
    license:'MIT',
    tags:['router','llm','cost-optimization'], tools:['terminal','web_search'],
    vs:'verified', v_score:0.75, stars:456, forks:89, watchers:32, featured:1,
    complexity:'Advanced', deploy:'Local', skills:['Python','API'], deps:['openrouter-api'],
  },
  {
    name:'Code Review Assistant', slug:'code-review-assistant',
    resource_type:'agent', type:'agent',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['Code & Development','Security'],
    description:'Reviews pull requests, suggests improvements, checks for security issues and best practices.',
    long_description:'An AI-powered code review agent for code quality, security, performance, and convention checks. Leaves inline comments and generates summary reports.',
    author_github:'codereview-ai', repository_url:'https://github.com/codereview-ai/code-review-assistant',
    license:'MIT',
    tags:['code-review','github','security'], tools:['terminal','file','web_search'],
    vs:'verified', v_score:0.75, stars:412, forks:67, watchers:31, featured:1,
    complexity:'Intermediate', deploy:'Local', skills:['Python','Code analysis'], deps:['tree-sitter'],
  },
  {
    name:'Web Scraper Bot', slug:'web-scraper-bot',
    resource_type:'agent', type:'tool',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['Web & Browser','Data & Analysis'],
    description:'Extracts structured data from websites with automatic schema detection and export.',
    long_description:'Intelligent web scraping agent with pagination, auth, and anti-bot handling. Exports to JSON and CSV.',
    author_github:'scrape-labs', repository_url:'https://github.com/scrape-labs/web-scraper-bot',
    license:'Apache-2.0',
    tags:['web-scraping','extraction'], tools:['browser','file','terminal'],
    vs:'verified', v_score:0.75, stars:156, forks:22, watchers:8, featured:0,
    complexity:'Intermediate', deploy:'Local', skills:['Python'], deps:['Playwright','BeautifulSoup'],
  },
  {
    name:'Docker Deploy Agent', slug:'docker-deploy-agent',
    resource_type:'agent', type:'agent',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['DevOps & Infra','Automation'],
    description:'Builds, tags, and deploys Docker containers to cloud providers with zero-config detection.',
    long_description:'DevOps agent that generates Dockerfiles, builds images, and deploys to AWS, GCP, or DigitalOcean.',
    author_github:'devops-hero', repository_url:'https://github.com/devops-hero/docker-deploy-agent',
    license:'MIT', hermes:'>=1.0.0',
    tags:['docker','deployment','devops'], tools:['terminal','file'],
    vs:'verified', v_score:0.875, stars:267, forks:41, watchers:19, featured:0,
    complexity:'Advanced', deploy:'Docker', skills:['Docker','DevOps'], deps:['docker-compose'],
  },
  {
    name:'Prompt Caching Optimizer', slug:'prompt-caching-optimizer',
    resource_type:'skill', type:'skill',
    tier1_category:'SKILLS', tier1_subcategory:'Procedural skills',
    tier2:['AI & ML'],
    description:'Optimizes prompt caching across different LLM providers for cost and latency.',
    long_description:'Implements intelligent caching for Gemini, DeepSeek, and Kimi. Reduces API costs by 60%.',
    author_github:'kbbq', repository_url:'https://github.com/kbbq/prompt-caching-optimizer',
    license:'MIT',
    tags:['caching','optimization','llm'], tools:['terminal','memory'],
    vs:'verified', v_score:0.875, stars:89, forks:12, watchers:7, featured:0,
    complexity:'Advanced', deploy:'Local', skills:['Python','LLM APIs'], deps:['redis'],
  },
  {
    name:'Discord Gateway Integration', slug:'discord-gateway-integration',
    resource_type:'integration', type:'integration',
    tier1_category:'INTEGRATIONS', tier1_subcategory:'Platform integrations',
    tier2:['Communication','Automation'],
    description:'Full Discord integration with Hermes agent capabilities.',
    long_description:'Connect Hermes agents to Discord. Features slash commands, thread support, role-based access.',
    author_github:'discord-hub', repository_url:'https://github.com/discord-hub/hermes-discord-gateway',
    license:'MIT',
    tags:['discord','gateway','messaging'], tools:['terminal','web_search'],
    vs:'verified', v_score:0.875, stars:234, forks:45, watchers:15, featured:0,
    complexity:'Intermediate', deploy:'Cloud', skills:['Python','API'], deps:['discord.py'],
  },
  {
    name:'Workflow Automation Pipeline', slug:'workflow-automation-pipeline',
    resource_type:'workflow', type:'workflow',
    tier1_category:'WORKFLOWS', tier1_subcategory:'Pipeline workflows',
    tier2:['Automation','Enterprise'],
    description:'Multi-step workflow orchestration with conditional logic and parallel execution.',
    long_description:'Build complex workflows combining agents, tools, and integrations with branching and retry logic.',
    author_github:'kyle-thierry', repository_url:'https://github.com/kyle-thierry/hermes-workflow-pipeline',
    license:'MIT',
    tags:['workflow','orchestration','pipeline'], tools:['terminal','cronjob','file'],
    vs:'unverified', v_score:0.625, stars:120, forks:18, watchers:9, featured:0,
    complexity:'Advanced', deploy:'Hybrid', skills:['Python','Workflow design'], deps:['celery','redis'],
  },
  {
    name:'Vector Memory System', slug:'vector-memory-system',
    resource_type:'memory-system', type:'skill',
    tier1_category:'MEMORY SYSTEMS', tier1_subcategory:'RAG systems',
    tier2:['AI & ML'],
    description:'Persistent long-term memory with semantic search and RAG capabilities.',
    long_description:'Knowledge base with vector embeddings, automatic context injection, and semantic search.',
    author_github:'memora-dev', repository_url:'https://github.com/memora-dev/vector-memory-system',
    license:'Apache-2.0',
    tags:['vector-db','memory','rag','embeddings'], tools:['terminal','memory','file'],
    vs:'verified', v_score:0.875, stars:178, forks:29, watchers:13, featured:0,
    complexity:'Advanced', deploy:'Cloud', skills:['Python','Vector DBs'], deps:['chromadb','sentence-transformers'],
  },
  {
    name:'OpenRouter Model Preset', slug:'openrouter-model-preset',
    resource_type:'model-config', type:'skill',
    tier1_category:'MODEL CONFIGURATIONS', tier1_subcategory:'Model presets',
    tier2:['AI & ML'],
    description:'Pre-configured model presets for OpenRouter with optimal settings.',
    long_description:'Ready-to-use model configurations with optimized temperature, top_p, and context window.',
    author_github:'preset-dev', repository_url:'https://github.com/preset-dev/openrouter-model-presets',
    license:'MIT',
    tags:['openrouter','model-config','presets'], tools:['web_search'],
    vs:'unverified', v_score:0.5, stars:45, forks:7, watchers:3, featured:0,
    complexity:'Beginner', deploy:'Local', skills:['API config'], deps:['openrouter-sdk'],
  },
  {
    name:'Security Audit Agent', slug:'security-audit-agent',
    resource_type:'agent', type:'agent',
    tier1_category:'AGENTS', tier1_subcategory:'Task-specific agents',
    tier2:['Security','Code & Development'],
    description:'Automated security auditing and vulnerability detection for codebases.',
    long_description:'Scans for vulnerabilities, misconfigurations, and compliance violations with detailed reports.',
    author_github:'secure-ai', repository_url:'https://github.com/secure-ai/security-audit-agent',
    license:'MIT', hermes:'>=1.0.0',
    tags:['security','vulnerability','compliance'], tools:['terminal','file','web_search','vision'],
    vs:'verified', v_score:0.75, stars:290, forks:44, watchers:21, featured:0,
    complexity:'Advanced', deploy:'Local', skills:['Security','Code analysis'], deps:['bandit','safety'],
  },
  {
    name:'Telegram Bot Integration', slug:'telegram-bot-integration',
    resource_type:'integration', type:'integration',
    tier1_category:'INTEGRATIONS', tier1_subcategory:'Platform integrations',
    tier2:['Communication','Automation'],
    description:'Seamless Telegram integration for Hermes agent interaction.',
    long_description:'Deploy Hermes agents on Telegram with inline keyboard, file handling, and webhook support.',
    author_github:'telegram-integrator', repository_url:'https://github.com/telegram-integrator/hermes-telegram-bot',
    license:'MIT',
    tags:['telegram','bot','messaging'], tools:['terminal','web_search'],
    vs:'verified', v_score:0.875, stars:178, forks:32, watchers:14, featured:0,
    complexity:'Intermediate', deploy:'Cloud', skills:['Python','API'], deps:['python-telegram-bot'],
  },
];

const catSlug = (name: string) => catMap[name] || null;

const insAgent = db.prepare(`
  INSERT INTO agents (
    name, slug, resource_type, type, description, long_description,
    author_github, repository_url, homepage_url, license, hermes_version_required,
    tier1_category, tier1_subcategory, tier2_categories, use_cases,
    complexity_level, deployment_type, required_skills, external_dependencies, maintenance_status,
    tags, tools_used, verification_status, verification_score,
    verification_checks, stars, forks, watchers, is_featured
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const linkCat = db.prepare('INSERT OR IGNORE INTO agent_categories (agent_id, category_id) VALUES (?, ?)');

for (const a of RES) {
  const result = insAgent.run(
    a.name, a.slug, a.resource_type, a.type, a.description, a.long_description ?? null,
    a.author_github, a.repository_url, a.homepage_url ?? null, a.license ?? null,
    a.hermes ?? null, a.tier1_category, a.tier1_subcategory,
    JSON.stringify(a.tier2), JSON.stringify(a.tier2),
    a.complexity, a.deploy,
    JSON.stringify(a.skills), JSON.stringify(a.deps),
    'Active',
    JSON.stringify(a.tags), JSON.stringify(a.tools),
    a.vs, a.v_score,
    JSON.stringify({
      has_hermes_dependency: a.v_score > 0.375,
      has_hermes_import: a.v_score > 0.5,
      readme_mentions_hermes: a.v_score > 0.5,
      has_valid_metadata: true, not_a_fork: true,
      has_tests: a.v_score > 0.8, has_license: a.v_score > 0.6,
      readme_detailed: a.v_score > 0.75,
    }),
    a.stars, a.forks, a.watchers, a.featured
  );

  const id = Number(result.lastInsertRowid);
  // Resource type
  const rtSlug = a.resource_type === 'model-config' ? 'model-configs' :
                 a.resource_type === 'memory-system' ? 'memory-systems' :
                 `${a.resource_type}s`;
  const rtId = catMap[rtSlug];
  if (rtId) linkCat.run(id, rtId);

  // Use case categories
  for (const c of a.tier2) {
    const catId = catSlug(c);
    if (catId) linkCat.run(id, catId);
  }
}

console.log('✅ Seeded ' + RES.length + ' resources');
console.log('📊 Types:');
db.prepare('SELECT resource_type, COUNT(*) as c FROM agents GROUP BY 1 ORDER BY c DESC').all().forEach((r: any) => {
  console.log('  ' + r.resource_type + ': ' + r.c);
});
