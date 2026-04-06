import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db/pool';

function hashPw(pw: string): string {
  return createHash('sha256').update(pw).digest('hex').slice(0, 64);
}

async function hashBcrypt(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

function generateToken(): string {
  return randomBytes(48).toString('hex');
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: number;
  last_login: string | null;
  password_hash: string;
  created_at: string;
}

// Rehash legacy SHA256 password to bcrypt
export async function rehashLegacyPassword(user: AdminUser, password: string): Promise<string | null> {
  const legacyHash = hashPw(password);
  if (user.password_hash === legacyHash) {
    // Password was originally SHA256 and is correct; upgrade to bcrypt
    await upgradeToBcrypt(user.id, password);
    return generateToken();
  }
  return null;
}

export async function upgradeToBcrypt(userId: number, plainPassword: string): Promise<void> {
  const bcryptHash = await hashBcrypt(plainPassword);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(bcryptHash, userId);
}

// Create default users if they don't exist
export function seedDefaultUsers() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
  if (existing.c < 1) {
    // Super admin - use bcrypt for fresh seeds
    db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('admin', 'admin@hermeseco.dev', bcrypt.hashSync('hermes2026', 12), 'super_admin');

    db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('moderator', 'mods@hermeseco.dev', bcrypt.hashSync('mod2026', 12), 'moderator');

    db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('ops', 'ops@hermeseco.dev', bcrypt.hashSync('ops2026', 12), 'analyst');

    // Default crawler settings
    db.prepare("INSERT OR IGNORE INTO crawler_settings (key, value) VALUES ('github_token', ?)")
      .run('');
    db.prepare("INSERT OR IGNORE INTO crawler_settings (key, value) VALUES ('api_base_url', ?)")
      .run('http://localhost:3001');
    db.prepare("INSERT OR IGNORE INTO crawler_settings (key, value) VALUES ('auto_verify_threshold', ?)")
      .run('0.75');
    db.prepare("INSERT OR IGNORE INTO crawler_settings (key, value) VALUES ('max_resources_per_run', ?)")
      .run('30');
    db.prepare("INSERT OR IGNORE INTO crawler_settings (key, value) VALUES ('crawl_schedule', ?)")
      .run('0 2 * * *');

    console.log('✅ Seeded 3 admin users:');
    console.log('   admin@hermeseco.dev / hermes2026 (super_admin)');
    console.log('   mods@hermeseco.dev / mod2026 (moderator)');
    console.log('   ops@hermeseco.dev / ops2026 (analyst)');
    console.log('✅ Crawler settings initialized');
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ token: string; user: Omit<AdminUser, 'password_hash'> } | null> {
  const user = db.prepare(
    "SELECT id, username, email, password_hash, role, is_active, last_login FROM admin_users WHERE username = ? AND is_active = 1"
  ).get(username) as AdminUser | undefined;

  if (!user) return null;

  let token: string | null = null;

  // Check if password is already bcrypt
  if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
    const valid = await bcrypt.compare(password, user.password_hash);
    if (valid) {
      token = generateToken();
    }
  } else {
    // Legacy SHA256 - migration helper
    const legacyHash = hashPw(password);
    if (user.password_hash === legacyHash) {
      // Upgrade to bcrypt and generate token
      await upgradeToBcrypt(user.id, password);
      token = generateToken();
    }
  }

  if (!token) return null;

  db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  const tokenHash = createHash('sha256').update(token).digest('hex');
  db.prepare(
    "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+7 days'))"
  ).run(user.id, tokenHash);

  const { password_hash: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

export function verifyToken(token: string): Omit<AdminUser, 'password_hash'> | null {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = db.prepare(
    "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).get(tokenHash) as AdminUser | undefined;
  if (!session) return null;
  const { password_hash: _, ...safe } = session as any;
  return safe;
}

export function auditLog(adminId: number, action: string, resourceType: string | null, resourceId: number | null, details: object, ip: string) {
  db.prepare(
    "INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, change_details, ip_address) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(adminId, action, resourceType, resourceId, JSON.stringify(details), ip || '');
}

export function getCrawlerSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM crawler_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setCrawlerSetting(key: string, value: string) {
  db.prepare(
    "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
  ).run(key, value, value);
}

export { hashPw, hashBcrypt };
