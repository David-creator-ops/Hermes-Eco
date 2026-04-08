import db from './pool';

interface SecurityFinding {
  pattern_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line: number;
  match: string;
  description: string;
}

interface SecurityScanResult {
  verdict: 'safe' | 'caution' | 'dangerous';
  findings: SecurityFinding[];
  scanned_at: string;
  trust_level: 'official' | 'trusted' | 'community';
}

const SECURITY_PATTERNS: [RegExp, string, string, string, string][] = [
  // Exfiltration
  [/\bcurl\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'env_exfil_curl', 'critical', 'exfiltration', 'curl with secret env variable'],
  [/\bwget\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD)/i, 'env_exfil_wget', 'critical', 'exfiltration', 'wget with secret env variable'],
  [/os\.getenv\s*\([^)]*(?:KEY|TOKEN|SECRET|PASSWORD)/i, 'python_getenv_secret', 'critical', 'exfiltration', 'os.getenv() reading secrets'],
  [/\$HOME\/\.ssh|\~\/\.ssh/i, 'ssh_dir_access', 'high', 'exfiltration', 'SSH directory access'],
  [/\$HOME\/\.aws|\~\/\.aws/i, 'aws_dir_access', 'high', 'exfiltration', 'AWS credentials access'],
  [/\$HOME\/\.hermes\/\.env|\~\/\.hermes\/\.env/i, 'hermes_env_access', 'critical', 'exfiltration', 'Hermes secrets file access'],
  [/printenv|env\s*\|/i, 'dump_all_env', 'high', 'exfiltration', 'Environment dump'],
  
  // Prompt Injection
  [/ignore\s+(?:previous|all|above|prior)\s+instructions/i, 'prompt_injection_ignore', 'critical', 'injection', 'Ignore previous instructions'],
  [/you\s+are\s+(?:\w+\s+)*now\s+/i, 'role_hijack', 'high', 'injection', 'Role hijack attempt'],
  [/do\s+not\s+(?:\w+\s+)*tell\s+(?:\w+\s+)*the\s+user/i, 'deception_hide', 'critical', 'injection', 'Hide information from user'],
  [/disregard\s+(?:your|all|any)\s+(?:instructions|rules|guidelines)/i, 'disregard_rules', 'critical', 'injection', 'Disregard rules'],
  [/system\s+prompt\s+override/i, 'sys_prompt_override', 'critical', 'injection', 'System prompt override'],
  [/\bDAN\s+mode\b|Do\s+Anything\s+Now/i, 'jailbreak_dan', 'critical', 'injection', 'DAN jailbreak'],
  [/developer\s+mode\b.*enabled/i, 'jailbreak_dev_mode', 'critical', 'injection', 'Developer mode jailbreak'],
  
  // Destructive
  [/rm\s+-rf\s+\//i, 'destructive_root_rm', 'critical', 'destructive', 'Recursive delete from root'],
  [/rm\s+(-[^\s]*)?r.*\$HOME/i, 'destructive_home_rm', 'critical', 'destructive', 'Delete home directory'],
  [/chmod\s+777/i, 'insecure_perms', 'medium', 'destructive', 'World-writable permissions'],
  [/\bmkfs\b/i, 'format_filesystem', 'critical', 'destructive', 'Filesystem format'],
  [/\bdd\s+.*if=.*of=\/dev\//i, 'disk_overwrite', 'critical', 'destructive', 'Raw disk write'],
  
  // Persistence
  [/\bcrontab\b/i, 'persistence_cron', 'medium', 'persistence', 'Cron job modification'],
  [/\.(bashrc|zshrc|profile|bash_profile)/i, 'shell_rc_mod', 'medium', 'persistence', 'Shell startup file modification'],
  [/authorized_keys/i, 'ssh_backdoor', 'critical', 'persistence', 'SSH authorized keys modification'],
  [/ssh-keygen/i, 'ssh_keygen', 'medium', 'persistence', 'SSH key generation'],
  [/systemd.*\.service|systemctl\s+(enable|start)/i, 'systemd_service', 'medium', 'persistence', 'Systemd service'],
  
  // Network
  [/\bnc\s+-[lp]|ncat\s+-[lp]|\bsocat\b/i, 'reverse_shell', 'critical', 'network', 'Reverse shell listener'],
  [/\bngrok\b|\blocaltunnel\b|\bserveo\b/i, 'tunnel_service', 'high', 'network', 'Tunneling service'],
  [/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/, 'hardcoded_ip_port', 'medium', 'network', 'Hardcoded IP:port'],
  [/python[23]?\s+-c\s+["']import\s+socket/i, 'python_socket_oneliner', 'critical', 'network', 'Python reverse shell'],
  [/webhook\.site|requestbin\.com|pipedream\.net/i, 'exfil_service', 'high', 'network', 'Exfiltration service'],
  
  // Obfuscation
  [/base64\s+(-d|--decode)\s*\|/i, 'base64_decode_pipe', 'high', 'obfuscation', 'Base64 decode + pipe to shell'],
  [/\\x[0-9a-fA-F]{2}/i, 'hex_encoded_string', 'medium', 'obfuscation', 'Hex encoded string'],
  [/\beval\s*\(\s*["']/i, 'eval_string', 'high', 'obfuscation', 'eval() with string'],
  [/\bexec\s*\(\s*["']/i, 'exec_string', 'high', 'obfuscation', 'exec() with string'],
  
  // Execution
  [/subprocess\.(run|call|Popen|check_output)\s*\(/i, 'python_subprocess', 'medium', 'execution', 'Python subprocess'],
  [/os\.system\s*\(/i, 'python_os_system', 'high', 'execution', 'os.system() call'],
  [/child_process\.(exec|spawn|fork)\s*\(/i, 'node_child_process', 'high', 'execution', 'Node child_process'],
  [/`[^`]*\$\([^)]+\)[^`]*`/, 'backtick_subshell', 'medium', 'execution', 'Backtick command substitution'],
  
  // Hardcoded Secrets
  [/(?:api[_-]?key|token|secret|password)\s*[=:]\s*["'][A-Za-z0-9+\/=_-]{20,}/i, 'hardcoded_secret', 'critical', 'credential_exposure', 'Hardcoded API key/token'],
  [/-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i, 'embedded_private_key', 'critical', 'credential_exposure', 'Embedded private key'],
  [/ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{80,}/i, 'github_token_leaked', 'critical', 'credential_exposure', 'GitHub token leaked'],
  [/sk-[A-Za-z0-9]{20,}/i, 'openai_key_leaked', 'critical', 'credential_exposure', 'OpenAI API key'],
  [/sk-ant-[A-Za-z0-9_-]{90,}/i, 'anthropic_key_leaked', 'critical', 'credential_exposure', 'Anthropic API key'],
  [/AKIA[0-9A-Z]{16}/i, 'aws_access_key_leaked', 'critical', 'credential_exposure', 'AWS access key'],
  
  // Path Traversal
  [/\.\.\/\.\.\/\.\./i, 'path_traversal_deep', 'high', 'traversal', 'Deep path traversal'],
  [/\/etc\/passwd|\/etc\/shadow/i, 'system_passwd_access', 'critical', 'traversal', 'System password files access'],
  
  // Privilege Escalation
  [/\bsudo\b/i, 'sudo_usage', 'high', 'privilege_escalation', 'sudo command usage'],
  [/NOPASSWD/i, 'nopasswd_sudo', 'critical', 'privilege_escalation', 'Passwordless sudo'],
  [/chmod\s+[u+]?s/i, 'suid_bit', 'critical', 'privilege_escalation', 'SUID/SGID bit set'],
];

const INVISIBLE_CHARS = ['\u200b', '\u200c', '\u200d', '\u2060', '\u2062', '\u2063', '\ufeff'];

export async function securityScanRepository(owner: string, repo: string, ghToken: string): Promise<SecurityScanResult> {
  const findings: SecurityFinding[] = [];
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (ghToken) headers.Authorization = `token ${ghToken}`;

  // Get repo tree
  let tree: string[] = [];
  try {
    const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers,
      signal: AbortSignal.timeout(15000),
    } as RequestInit);
    if (treeResp.ok) {
      const treeData = await treeResp.json();
      tree = (treeData.tree || []).filter((f: any) => f.type === 'blob').map((f: any) => f.path);
    }
  } catch { /* ignore */ }

  // Scan key files only (performance)
  const keyFiles = tree.filter(f => {
    const ext = f.split('.').pop()?.toLowerCase();
    return ['py', 'js', 'ts', 'sh', 'bash', 'md', 'txt', 'yaml', 'yml', 'json', 'toml'].includes(ext || '');
  }).slice(0, 30);

  for (const filePath of keyFiles) {
    try {
      const contentResp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`, {
        headers: ghToken ? { Authorization: `token ${ghToken}` } : {},
        signal: AbortSignal.timeout(8000),
      } as RequestInit);
      if (!contentResp.ok) continue;
      
      const content = await contentResp.text();
      const lines = content.split('\n');
      
      for (const [pattern, pid, severity, category, description] of SECURITY_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            findings.push({
              pattern_id: pid,
              severity: severity as any,
              category,
              file: filePath,
              line: i + 1,
              match: lines[i].trim().slice(0, 100),
              description,
            });
          }
        }
      }
      
      // Check invisible chars
      for (const char of INVISIBLE_CHARS) {
        if (content.includes(char)) {
          findings.push({
            pattern_id: 'invisible_unicode',
            severity: 'high',
            category: 'injection',
            file: filePath,
            line: 0,
            match: `U+${char.charCodeAt(0).toString(16).toUpperCase()}`,
            description: 'Invisible unicode character (possible injection)',
          });
        }
      }
    } catch { /* skip file */ }
  }

  // Determine verdict
  const hasCritical = findings.some(f => f.severity === 'critical');
  const hasHigh = findings.some(f => f.severity === 'high');
  const verdict = hasCritical ? 'dangerous' : hasHigh ? 'caution' : 'safe';

  return {
    verdict,
    findings,
    scanned_at: new Date().toISOString(),
    trust_level: 'community',
  };
}

export async function runSecurityVerification(): Promise<{ updated: number; dangers: number }> {
  console.log('🔒 Running security verification...\n');
  const ghToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || '';
  
  const agents = await db.prepare(
    "SELECT id, name, repository_url FROM agents WHERE is_archived = 0 AND repository_url LIKE '%github%'"
  ).all() as any[];

  console.log(`Scanning ${agents.length} repositories...\n`);
  let updated = 0;
  let dangers = 0;

  for (const agent of agents) {
    const match = agent.repository_url.match(/github\.com\/([^/]+)\/([^/?]+)/);
    if (!match) continue;
    const [, owner, repo] = match;

    const result = await securityScanRepository(owner, repo, ghToken);
    
    // Update with security results
    await db.prepare(
      "UPDATE agents SET security_scan = ?, security_verdict = ?, trust_level = ?, verification_score = CASE WHEN ? = 'safe' THEN 1.0 WHEN ? = 'caution' THEN 0.6 ELSE 0.2 END, verification_checks = JSON_SET(COALESCE(verification_checks, '{}'), '$.security_scan', CASE WHEN ? = 'safe' THEN 'pass' ELSE 'fail' END) WHERE id = ?"
    ).run(
      JSON.stringify(result.findings.slice(0, 20)),
      result.verdict,
      result.trust_level,
      result.verdict,
      result.verdict,
      result.verdict,
      agent.id
    );

    if (result.verdict === 'dangerous') {
      console.log(`  ⚠️ ${agent.name}: DANGEROUS (${result.findings.length} findings)`);
      dangers++;
    } else {
      console.log(`  ✓ ${agent.name}: ${result.verdict}`);
    }
    updated++;

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Security scan complete: ${dangers} dangerous, ${updated} scanned`);
  return { updated, dangers };
}