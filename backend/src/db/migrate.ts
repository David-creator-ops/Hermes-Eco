import db from './pool';

db.exec(`
-- Existing tables
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resource_type TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  author_github TEXT NOT NULL,
  repository_url TEXT UNIQUE NOT NULL,
  homepage_url TEXT,
  license TEXT,
  hermes_version_required TEXT,
  tier1_category TEXT,
  tier1_subcategory TEXT,
  tier2_categories TEXT DEFAULT '[]',
  use_cases TEXT DEFAULT '[]',
  complexity_level TEXT,
  deployment_type TEXT,
  required_skills TEXT DEFAULT '[]',
  external_dependencies TEXT DEFAULT '[]',
  maintenance_status TEXT DEFAULT 'active',
  compatible_resources TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  tools_used TEXT DEFAULT '[]',
  verification_status TEXT DEFAULT 'unverified',
  verification_score REAL DEFAULT 0,
  verification_checks TEXT DEFAULT '{}',
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  last_commit_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_crawled TEXT,
  icon_url TEXT,
  banner_url TEXT,
  is_featured INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(resource_type);
CREATE INDEX IF NOT EXISTS idx_agents_verify ON agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_agents_tier1 ON agents(tier1_category);
CREATE INDEX IF NOT EXISTS idx_agents_created ON agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_stars ON agents(stars DESC);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS agent_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER REFERENCES agents(id),
  category_id INTEGER REFERENCES categories(id),
  UNIQUE(agent_id, category_id)
);

CREATE TABLE IF NOT EXISTS resource_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id_1 INTEGER REFERENCES agents(id),
  resource_id_2 INTEGER REFERENCES agents(id),
  relationship_type TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'web_form',
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  primary_category TEXT,
  description TEXT,
  author_github TEXT,
  repository_url TEXT,
  license TEXT,
  complexity TEXT,
  deployment TEXT,
  tags TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  verification_score REAL DEFAULT 0,
  verification_details TEXT DEFAULT '{}',
  verified_at TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'moderator',
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Admin sessions (tokens)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES admin_users(id),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Crawler settings (key-value store)
CREATE TABLE IF NOT EXISTS crawler_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  change_details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Crawler run logs
CREATE TABLE IF NOT EXISTS crawler_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger TEXT,
  status TEXT DEFAULT 'running',
  resources_found INTEGER DEFAULT 0,
  resources_processed INTEGER DEFAULT 0,
  resources_failed INTEGER DEFAULT 0,
  details TEXT DEFAULT '{}',
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_crawler_runs_status ON crawler_runs(status);

CREATE TABLE IF NOT EXISTS featured_requests (
  id INTEGER PRIMARY KEY,
  resource_name TEXT NOT NULL,
  github_url TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  resource_id INTEGER REFERENCES agents(id),
  paid INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by INTEGER REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON featured_requests(status);
`);

console.log('All tables created (agents, categories, submissions, admin_users, crawler_settings, audit_logs, crawler_runs, featured_requests)');
export { db };
