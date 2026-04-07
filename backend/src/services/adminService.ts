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
  await db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(bcryptHash, userId);
}

// Create default users if they don't exist
export async function seedDefaultUsers() {
  const existing = await db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
  if (existing.c < 1) {
    // Super admin - use bcrypt for fresh seeds
    await db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('admin', 'admin@hermeseco.dev', await bcrypt.hash('hermes2026', 12), 'super_admin');

    await db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('moderator', 'mods@hermeseco.dev', await bcrypt.hash('mod2026', 12), 'moderator');

    await db.prepare(
      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run('ops', 'ops@hermeseco.dev', await bcrypt.hash('ops2026', 12), 'analyst');

    // Default crawler settings - use pg-compatible upsert
    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('github_token', '');
    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('api_base_url', 'http://localhost:3001');
    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('auto_verify_threshold', '0.75');
    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('max_resources_per_run', '30');
    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('crawl_schedule', '0 2 * * *');

    console.log('✅ Seeded 3 admin users:');
    console.log('   admin@hermeseco.dev / hermes2026 (super_admin)');
    console.log('   mods@hermeseco.dev / mod2026 (moderator)');
    console.log('   ops@hermeseco.dev / ops2026 (analyst)');
    console.log('✅ Crawler settings initialized');
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ token: string; user: Omit<AdminUser, 'password_hash'> } | null> {
  const user = await db.prepare(
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

  await db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  const tokenHash = createHash('sha256').update(token).digest('hex');
  await db.prepare(
    "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+7 days'))"
  ).run(user.id, tokenHash);

  const { password_hash: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

export async function verifyToken(token: string): Promise<Omit<AdminUser, 'password_hash'> | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = await db.prepare(
    "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > datetime('now')"
  ).get(tokenHash) as AdminUser | undefined;
  if (!session) return null;
  const { password_hash: _, ...safe } = session as any;
  return safe;
}

export async function auditLog(adminId: number, action: string, resourceType: string | null, resourceId: number | null, details: object, ip: string) {
  await db.prepare(
    "INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, change_details, ip_address) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(adminId, action, resourceType, resourceId, JSON.stringify(details), ip || '');
}

export async function getCrawlerSetting(key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM crawler_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export async function setCrawlerSetting(key: string, value: string) {
  await db.prepare(
    "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
  ).run(key, value, value);
}

export { hashPw, hashBcrypt };
