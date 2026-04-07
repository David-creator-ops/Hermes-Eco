CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  resource_type TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  author_github TEXT NOT NULL,
  repository_url TEXT NOT NULL,
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
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  last_crawled TEXT,
  icon_url TEXT,
  banner_url TEXT,
  is_featured INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
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
  submitted_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES admin_users(id),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  change_details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS crawler_runs (
  id SERIAL PRIMARY KEY,
  trigger TEXT,
  status TEXT DEFAULT 'running',
  resources_found INTEGER DEFAULT 0,
  resources_processed INTEGER DEFAULT 0,
  resources_failed INTEGER DEFAULT 0,
  details TEXT DEFAULT '{}',
  started_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS crawler_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS featured_requests (
  id SERIAL PRIMARY KEY,
  resource_name TEXT NOT NULL,
  github_url TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  resource_id INTEGER REFERENCES agents(id),
  paid INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  reviewed_at TEXT,
  reviewed_by INTEGER REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_resource_type ON agents(resource_type);
CREATE INDEX IF NOT EXISTS idx_agents_verification_status ON agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_agents_is_featured ON agents(is_featured);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_crawler_runs_status ON crawler_runs(status);
CREATE INDEX IF NOT EXISTS idx_featured_requests_status ON featured_requests(status);
