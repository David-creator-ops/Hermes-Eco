     1|import { randomBytes, createHash } from 'crypto';
     2|import bcrypt from 'bcryptjs';
     3|import db from '../db/pool';
     4|
     5|function hashPw(pw: string): string {
     6|  return createHash('sha256').update(pw).digest('hex').slice(0, 64);
     7|}
     8|
     9|async function hashBcrypt(pw: string): Promise<string> {
    10|  return bcrypt.hash(pw, 12);
    11|}
    12|
    13|function generateToken(): string {
    14|  return randomBytes(48).toString('hex');
    15|}
    16|
    17|interface AdminUser {
    18|  id: number;
    19|  username: string;
    20|  email: string;
    21|  role: string;
    22|  is_active: number;
    23|  last_login: string | null;
    24|  password_hash: string;
    25|  created_at: string;
    26|}
    27|
    28|// Rehash legacy SHA256 password to bcrypt
    29|export async function rehashLegacyPassword(user: AdminUser, password: string): Promise<string | null> {
    30|  const legacyHash = hashPw(password);
    31|  if (user.password_hash === legacyHash) {
    32|    // Password was originally SHA256 and is correct; upgrade to bcrypt
    33|    await upgradeToBcrypt(user.id, password);
    34|    return generateToken();
    35|  }
    36|  return null;
    37|}
    38|
    39|export async function upgradeToBcrypt(userId: number, plainPassword: string): Promise<void> {
    40|  const bcryptHash = await hashBcrypt(plainPassword);
    41|  await db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(bcryptHash, userId);
    42|}
    43|
    44|// Create default users if they don't exist
    45|export async function seedDefaultUsers() {
    46|  const existing = await db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
    47|  if (existing.c < 1) {
    48|    // Super admin - use bcrypt for fresh seeds
    49|    await db.prepare(
    50|      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    51|    ).run('admin', 'admin@hermeseco.dev', await bcrypt.hash('hermes2026', 12), 'super_admin');
    52|
    53|    await db.prepare(
    54|      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    55|    ).run('moderator', 'mods@hermeseco.dev', await bcrypt.hash('mod2026', 12), 'moderator');
    56|
    57|    await db.prepare(
    58|      "INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
    59|    ).run('ops', 'ops@hermeseco.dev', await bcrypt.hash('ops2026', 12), 'analyst');
    60|
    61|    // Default crawler settings - use pg-compatible upsert
    62|    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('github_token', '');
    63|    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('api_base_url', 'http://localhost:3001');
    64|    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('auto_verify_threshold', '0.75');
    65|    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('max_resources_per_run', '30');
    66|    await db.prepare("INSERT INTO crawler_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING").run('crawl_schedule', '0 2 * * *');
    67|
    68|    console.log('✅ Seeded 3 admin users:');
    69|    console.log('   admin@hermeseco.dev / hermes2026 (super_admin)');
    70|    console.log('   mods@hermeseco.dev / mod2026 (moderator)');
    71|    console.log('   ops@hermeseco.dev / ops2026 (analyst)');
    72|    console.log('✅ Crawler settings initialized');
    73|  }
    74|}
    75|
    76|export async function authenticateUser(username: string, password: string): Promise<{ token: string; user: Omit<AdminUser, 'password_hash'> } | null> {
    77|  const user = await db.prepare(
    78|    "SELECT id, username, email, password_hash, role, is_active, last_login FROM admin_users WHERE username = ? AND is_active = 1"
    79|  ).get(username) as AdminUser | undefined;
    80|
    81|  if (!user) return null;
    82|
    83|  let token: string | null = null;
    84|
    85|  // Check if password is already bcrypt
    86|  if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
    87|    const valid = await bcrypt.compare(password, user.password_hash);
    88|    if (valid) {
    89|      token = generateToken();
    90|    }
    91|  } else {
    92|    // Legacy SHA256 - migration helper
    93|    const legacyHash = hashPw(password);
    94|    if (user.password_hash === legacyHash) {
    95|      // Upgrade to bcrypt and generate token
    96|      await upgradeToBcrypt(user.id, password);
    97|      token = generateToken();
    98|    }
    99|  }
   100|
   101|  if (!token) return null;
   102|
   103|  await db.prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?").run(user.id);
   104|
   105|  const tokenHash = createHash('sha256').update(token).digest('hex');
   106|  await db.prepare(
   107|    "INSERT INTO admin_sessions (user_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL '7 days')"
   108|  ).run(user.id, tokenHash);
   109|
   110|  const { password_hash: _, ...userWithoutPassword } = user;
   111|  return { token, user: userWithoutPassword };
   112|}
   113|
   114|export async function verifyToken(token: string): Promise<Omit<AdminUser, 'password_hash'> | null> {
   115|  const tokenHash = createHash('sha256').update(token).digest('hex');
   116|  const session = await db.prepare(
   117|    "SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > NOW()"
   118|  ).get(tokenHash) as AdminUser | undefined;
   119|  if (!session) return null;
   120|  const { password_hash: _, ...safe } = session as any;
   121|  return safe;
   122|}
   123|
   124|export async function auditLog(adminId: number, action: string, resourceType: string | null, resourceId: number | null, details: object, ip: string) {
   125|  await db.prepare(
   126|    "INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, change_details, ip_address) VALUES (?, ?, ?, ?, ?, ?)"
   127|  ).run(adminId, action, resourceType, resourceId, JSON.stringify(details), ip || '');
   128|}
   129|
   130|export async function getCrawlerSetting(key: string): Promise<string | null> {
   131|  const row = await db.prepare('SELECT value FROM crawler_settings WHERE key = ?').get(key) as { value: string } | undefined;
   132|  return row ? row.value : null;
   133|}
   134|
   135|export async function setCrawlerSetting(key: string, value: string) {
   136|  await db.prepare(
   137|    "INSERT INTO crawler_settings (key, value, updated_at) VALUES (?, ?, NOW()) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = NOW()"
   138|  ).run(key, value, value);
   139|}
   140|
   141|export { hashPw, hashBcrypt };
   142|