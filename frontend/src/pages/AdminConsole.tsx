import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API = '/api/console';

function getStoredToken() {
  return localStorage.getItem('admin_token');
}

// ── Login Page ──
export function LoginPage({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [tempUser, setTempUser] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      if (data.data.requires_2fa) {
        setTwoFARequired(true);
        setTempUser(username);
        setLoading(false);
        return;
      }
      
      onLogin(data.data.token, data.data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submit2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: tempUser, password, code: twoFACode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA verification failed');
      onLogin(data.data.token, data.data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center">
            <span className="text-xs font-bold text-[#7c3aed]">H</span>
          </div>
          <span className="text-sm font-semibold text-[#f0f0f0]">Hermes <span className="text-[#7c3aed]">Console</span></span>
        </div>

        <form onSubmit={twoFARequired ? submit2FA : submit} className="space-y-4 p-6 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold text-white mb-1">{twoFARequired ? 'Two-Factor Code' : 'Sign in'}</h2>
          <p className="text-[12px] text-[#666] mb-4">{twoFARequired ? 'Enter code from your authenticator app' : 'Manage the Hermes ecosystem'}</p>

          {twoFARequired ? (
            <>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Authentication Code</label>
                <input value={twoFACode} onChange={e => setTwoFACode(e.target.value)}
                  placeholder="000000" maxLength={6}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
              </div>
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
              </div>
            </>
          )}

          <div>
            <label className="block text-[12px] text-[#888] mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors"
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <span className="text-[12px] text-red-400">{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-10 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#333] mt-4">Hermes Agent Registry Admin</p>
      </div>
    </div>
  );
}

// ── Admin Shell ──
export function AdminShell({ user, token, onLogout }: { user: any; token: string; onLogout: () => void }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const nav = [
    { label: 'Dashboard', path: '/console', icon: '◉', roles: ['super_admin', 'moderator', 'analyst', 'support'] },
    { label: 'Analyze', path: '/console/analyze', icon: '⚡', roles: ['super_admin', 'moderator'] },
    { label: 'Submissions', path: '/console/submissions', icon: '◈', roles: ['super_admin', 'moderator'] },
    { label: 'Resources', path: '/console/resources', icon: '◆', roles: ['super_admin', 'moderator'] },
    { label: 'Categories', path: '/console/categories', icon: '🏷', roles: ['super_admin', 'moderator'] },
    { label: 'Featured', path: '/console/featured', icon: '★', roles: ['super_admin', 'moderator'] },
    { label: 'Crawler', path: '/console/crawler', icon: '◎', roles: ['super_admin', 'moderator', 'analyst'] },
    { label: 'Settings', path: '/console/settings', icon: '⚙', roles: ['super_admin'] },
    { label: 'Users', path: '/console/users', icon: '⬡', roles: ['super_admin'] },
    { label: 'Audit Log', path: '/console/audit', icon: '▤', roles: ['super_admin', 'analyst'] },
  ].filter(n => n.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}>
        <div className="flex items-center h-14 px-3 border-b border-[#1a1a1a]">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg hover:bg-[#151515] flex items-center justify-center text-[#888]">
            {collapsed ? '→' : '←'}
          </button>
          {!collapsed && (
            <span className="ml-3 text-sm font-semibold text-[#f0f0f0]">
              <span className="text-[#7c3aed]">H</span><span className="font-normal">Console</span>
            </span>
          )}
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {nav.map(n => {
            const active = location.pathname === n.path || (n.path !== '/console' && location.pathname.startsWith(n.path + '/'));
            return (
              <Link key={n.path} to={n.path}
                className={`flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active ? 'bg-[#7c3aed]/10 text-[#c4b5fd]' : 'text-[#666] hover:text-[#999] hover:bg-[#151515]'
                }`}>
                <span className="w-4 text-center">{n.icon}</span>
                {!collapsed && n.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#151515] border border-[#222] flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#7c3aed]">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-white truncate">{user.username}</div>
                  <div className="text-[9px] text-[#555] capitalize">{user.role}</div>
                </div>
              </>
            )}
          </div>
          {!collapsed && (
            <button onClick={onLogout}
              className="w-full mt-2 h-8 rounded-lg text-[11px] border border-[#1a1a1a] text-[#666] hover:text-white hover:border-[#333] transition-all">
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen ${collapsed ? 'ml-14' : 'ml-52'}`}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="crawler" element={<CrawlerPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="featured" element={<FeaturedRequestsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/console" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ── Dashboard ──
function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const token = getStoredToken();

  useEffect(() => {
    fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d.data));
  }, []);

  if (!data) return <LoadingSkeleton />;

  const t = data.totals;
  const stats = [
    { label: 'Total Resources', value: t?.total_resources || 0, color: 'text-white', icon: '◆' },
    { label: 'Pending Review', value: t?.pending_submissions || 0, color: 'text-amber-400', icon: '◈' },
    { label: 'Verified', value: t?.verified || 0, color: 'text-emerald-400', icon: '✓' },
    { label: 'Featured', value: t?.featured_count || 0, color: 'text-amber-300', icon: '★' },
    { label: 'Avg Stars', value: Math.round(t?.avg_stars || 0).toLocaleString(), color: 'text-blue-400', icon: '☆' },
    { label: 'Active Users', value: t?.active_users || 0, color: 'text-violet-400', icon: '⬡' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-white tracking-tight mb-6">Dashboard</h1>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm ${s.color}`}>{s.icon}</span>
              <span className="text-[11px] text-[#555]">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Verification breakdown + by type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Verification distribution */}
        <div className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h3 className="text-[13px] font-medium text-white mb-4">Verification Status</h3>
          <div className="space-y-3">
            {(() => {
              const d = data.verification_dist || {};
              const total = (d.verified || 0) + (d.unverified || 0) + (d.invalid || 0) || 1;
              const bars = [
                { label: 'Verified', count: d.verified || 0, bg: 'bg-emerald-400', text: 'text-emerald-400' },
                { label: 'Unverified', count: d.unverified || 0, bg: 'bg-amber-400', text: 'text-amber-400' },
                { label: 'Invalid', count: d.invalid || 0, bg: 'bg-red-400', text: 'text-red-400' },
              ];
              return bars.map(b => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-[#888]">{b.label}</span>
                    <span className={`text-[12px] font-medium ${b.text}`}>{b.count} ({Math.round((b.count / total) * 100)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#151515] overflow-hidden">
                    <div className={`h-full rounded-full ${b.bg} transition-all duration-500`} style={{ width: `${(b.count / total) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Resources by type */}
        <div className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h3 className="text-[13px] font-medium text-white mb-4">Resources by Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {data?.by_type?.map((rt: any) => (
              <div key={rt.resource_type} className="p-3 rounded-lg bg-[#111] border border-[#1a1a1a]">
                <div className="text-lg font-bold text-white tabular-nums">{rt.count}</div>
                <div className="text-[11px] text-[#555] capitalize">{rt.resource_type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top resources + submission sources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Top resources by stars */}
        <div className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h3 className="text-[13px] font-medium text-white mb-3">Top Resources by Stars</h3>
          {data?.top_resources?.length > 0 ? (
            <div className="space-y-1.5">
              {data.top_resources.map((r: any, i: number) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] text-[#444] w-4">#{i + 1}</span>
                    <div className="min-w-0">
                      <div className="text-[12px] text-white font-medium truncate">{r.name}</div>
                      <div className="text-[10px] text-[#555] capitalize">{r.resource_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-amber-400">★ {r.stars || 0}</span>
                    {r.is_featured ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">★</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#444] text-[12px]">No data yet</div>
          )}
        </div>

        {/* Submissions by source */}
        <div className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h3 className="text-[13px] font-medium text-white mb-3">Submissions by Source</h3>
          {data?.by_source?.length > 0 ? (
            <div className="space-y-1.5">
              {data.by_source.map((s: any) => (
                <div key={s.source} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                  <span className="text-[12px] text-[#888] capitalize">{s.source || 'direct'}</span>
                  <span className="text-[12px] font-medium text-white tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[#444] text-[12px]">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mb-8">
        <h3 className="text-[13px] font-medium text-white mb-3">Recent Activity</h3>
        <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
          {data?.recent_activity?.length > 0 ? data.recent_activity.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                a.type === 'submission' ? 'bg-blue-400' :
                a.type === 'crawler' ? 'bg-emerald-400' : 'bg-violet-400'
              }`} />
              <span className="text-[11px] text-[#555] w-20 capitalize">{a.type}</span>
              <span className="text-[12px] text-[#CCC] truncate">{String(a.name || '').slice(0, 60)}</span>
              <span className="text-[11px] text-[#444] ml-auto flex-shrink-0">{a.ts?.slice(0, 16)}</span>
            </div>
          )) : (
            <div className="py-8 text-center text-[#444] text-[12px]">No activity yet</div>
          )}
        </div>
      </div>

      {/* Quick overview lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent submissions */}
        {data?.recent?.length > 0 && (
          <div>
            <h3 className="text-[13px] font-medium text-white mb-3">Recent Submissions</h3>
            <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
              {data.recent.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.status === 'pending' ? 'bg-amber-400' : s.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-[13px] text-[#CCC]">{s.resource_name}</span>
                    <span className="text-[11px] text-[#555] capitalize">{s.resource_type}</span>
                  </div>
                  <span className="text-[11px] text-[#444]">{s.submitted_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crawler runs */}
        {data?.crawler_runs?.length > 0 && (
          <div>
            <h3 className="text-[13px] font-medium text-white mb-3">Recent Crawler Runs</h3>
            <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
              {data.crawler_runs.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'completed' ? 'bg-emerald-400' : r.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <span className="text-[13px] text-[#CCC] capitalize">{r.status}</span>
                    <span className="text-[11px] text-[#555]">{r.resources_processed || 0} processed</span>
                  </div>
                  <span className="text-[11px] text-[#444]">{r.started_at?.slice(0, 16)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Submissions ──
function SubmissionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('pending');
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const token = getStoredToken();

  const fetchItems = () => {
    fetch(`${API}/submissions?status=${status}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setItems(d.data || []));
  };

  useEffect(() => { fetchItems(); }, [status]);

  const action = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(p => ({ ...p, [id]: true }));
    await fetch(`${API}/submissions/${id}/${action}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    setProcessing(p => ({ ...p, [id]: false }));
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Submissions</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-all ${
              status === s ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]'
            }`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-[#444] text-sm">No submissions</div>
      ) : (
        <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
          {items.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-4 min-w-0">
                <div>
                  <div className="text-[13px] text-[#CCC] font-medium truncate">{s.resource_name}</div>
                  <div className="text-[11px] text-[#555] capitalize">{s.resource_type} · {s.author_github} · from {s.source}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-[#444] hidden sm:block">{s.submitted_at?.slice(0, 16)}</span>
                {s.status === 'pending' && (
                  <>
                    <button disabled={!!processing[s.id]} onClick={() => action(s.id, 'approve')}
                      className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                      {processing[s.id] ? '...' : 'Approve'}
                    </button>
                    <button disabled={!!processing[s.id]} onClick={() => action(s.id, 'reject')}
                      className="h-8 px-3 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {processing[s.id] ? '...' : 'Reject'}
                    </button>
                  </>
                )}
                {s.status !== 'pending' && (
                  <span className={`text-[11px] px-2 py-0.5 rounded ${
                    s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>{s.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resources ──
function ResourcesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 30;
  const token = getStoredToken();

  const fetchItems = () => {
    setLoading(true);
    fetch(`${API}/resources?search=${search}&page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setItems(d.data || []); console.log('Resources:', d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search, page]);

  const toggleFeatured = async (id: number) => {
    await fetch(`${API}/resources/${id}/toggle-featured`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  const archive = async (id: number) => {
    if (!confirm('Archive this resource?')) return;
    await fetch(`${API}/resources/${id}/archive`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  const scanOne = async (id: number) => {
    const res = await fetch(`${API}/resources/${id}/security-scan`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.data?.verdict === 'dangerous') {
      alert(`⚠️ DANGER: ${d.data.findings?.length || 0} security findings!\n\n` + (d.data.findings?.slice(0,3).map((f: any) => `${f.severity}: ${f.description}`).join('\n') || ''));
    } else {
      alert(`✓ Scan complete: ${d.data?.verdict?.toUpperCase() || 'safe'}`);
    }
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Resources</h1>
        <div className="w-52">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full h-8 px-2.5 rounded-lg bg-[#111] border border-[#1e1e1e] text-[12px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
        </div>
      </div>

      {/* Bulk Actions */}
        <div className="mb-6 p-4 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <h3 className="text-[12px] font-medium text-[#888] mb-3">Data Enrichment</h3>
          <div className="flex flex-wrap gap-2">
            <BulkActionButton
              onClick={async () => {
                await fetch(`${API}/fetch-readmes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                fetchItems();
              }}
              label="Fetch READMEs"
              description="Pull READMEs from GitHub & generate summaries"
            />
            <BulkActionButton
              onClick={async () => {
                await fetch(`${API}/verify-agents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                fetchItems();
              }}
              label="Verify & Enrich"
              description="Fetch live GitHub stats + verify repositories"
            />
            <BulkActionButton
              onClick={async () => {
                if (!confirm('Security scan ALL resources? This may take a while.')) return;
                await fetch(`${API}/security-scan`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                fetchItems();
              }}
              label="Security Scan All"
              description="Scan all repos for security threats"
            />
          </div>
        </div>

      {loading ? (
        <div className="py-20 text-center text-[#444]">Loading...</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-[#444] text-sm">No resources found</div>
      ) : (
        <>
          <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
            {items.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#0f0f0f] transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#CCC] font-medium truncate">{r.name}</span>
                    {r.is_featured && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">★</span>}
                    {r.security_verdict === 'dangerous' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">⚠️</span>}
                  </div>
                  <div className="text-[11px] text-[#555] flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-[#151515] text-[#777]">{r.resource_type}</span>
                    <span>@{r.author_github}</span>
                    <span>⭐{r.stars}</span>
                    <span className={`${r.trust_level === 'trusted' ? 'text-blue-400' : r.security_verdict === 'safe' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r.trust_level || r.security_verdict || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={`/agents/${r.slug}`} target="_blank" rel="noopener"
                    className="h-7 px-2 rounded text-[10px] bg-[#151515] text-[#555] hover:text-white" title="View">👁</a>
                  <button onClick={() => scanOne(r.id)}
                    className="h-7 px-2 rounded text-[10px] bg-[#151515] text-[#555] hover:text-emerald-400" title="Security scan">🔒</button>
                  <button onClick={() => toggleFeatured(r.id)}
                    className={`h-7 px-2 rounded text-[10px] ${r.is_featured ? 'bg-amber-500/10 text-amber-400' : 'bg-[#151515] text-[#555] hover:text-white'}`} title="Featured">★</button>
                  <button onClick={() => archive(r.id)}
                    className="h-7 px-2 rounded text-[10px] bg-[#151515] text-[#555] hover:text-red-400" title="Archive">🗑</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] disabled:opacity-30 hover:text-white transition-colors">← Previous</button>
            <span className="text-[12px] text-[#444]">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] hover:text-white transition-colors">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Crawler Settings ──
function CrawlerPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [runs, setRuns] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const token = getStoredToken();

  const fetchData = () => {
    fetch(`${API}/crawler/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setSettings(d.data.settings || {}); setRuns(d.data.recent_runs || []); });
  };

  useEffect(() => { fetchData(); }, []);

  const saveSettings = async () => {
    await fetch(`${API}/crawler/settings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const runCrawler = async () => {
    setRunning(true);
    await fetch(`${API}/crawler/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setRunning(false);
    fetchData();
  };

  const update = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Crawler</h1>
        <div className="flex gap-2">
          <button onClick={runCrawler} disabled={running}
            className="h-8 px-4 rounded-lg bg-[#7c3aed]/15 ring-1 ring-[#7c3aed]/20 text-[#c4b5fd] text-[12px] font-medium hover:bg-[#7c3aed]/25 transition-all disabled:opacity-50">
            {running ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-medium text-white">Crawler Settings</h3>
          <button onClick={saveSettings}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-all ${
              saved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
            }`}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        <div className="space-y-4 max-w-lg">
          <Field label="GitHub API Token" type="password" value={settings.github_token || ''} onChange={v => update('github_token', v)}
            hint="Personal access token with repo scope (increases rate limit to 5000/hr)" />
          <Field label="API Base URL" value={settings.api_base_url || ''} onChange={v => update('api_base_url', v)}
            hint="URL where the backend API is hosted" />
          <Field label="Verify Threshold" value={settings.auto_verify_threshold || '0.75'} onChange={v => update('auto_verify_threshold', v)}
            hint="Min verification score to auto-approve (0-1)" />
          <Field label="Max Resources Per Run" value={settings.max_resources_per_run || '30'} onChange={v => update('max_resources_per_run', v)}
            hint="Limit to stay within API rate limits" />
          <Field label="Schedule (CRON)" value={settings.crawl_schedule || '0 2 * * *'} onChange={v => update('crawl_schedule', v)}
            hint="When to run automatically (for GitHub Actions)" />
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <h3 className="text-[13px] font-medium text-white mb-3">Recent Runs</h3>
        {runs.length === 0 ? (
          <div className="py-8 text-center text-[#444] text-sm">No crawler runs yet</div>
        ) : (
          <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
            {runs.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${r.status === 'completed' ? 'bg-emerald-400' : r.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-[13px] text-[#CCC] capitalize">{r.status}</span>
                  <span className="text-[11px] text-[#555]">{r.resources_found || 0} found · {r.resources_processed || 0} processed</span>
                </div>
                <span className="text-[11px] text-[#444]">{r.started_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; type?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[12px] font-medium text-[#888]">{label}</label>
        {hint && <span className="text-[10px] text-[#444]">{hint}</span>}
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[12px] text-[#CCC] placeholder:text-[#444] focus:outline-none focus:border-[#7c3aed]/40 transition-colors" />
    </div>
  );
}

// ── Users ──
function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'moderator', password: '' });
  const [creating, setCreating] = useState(false);
  const token = getStoredToken();

  const fetchUsers = () => {
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUsers(d.data || []));
  };
  useEffect(() => { fetchUsers(); }, []);

  const paginatedUsers = users.slice((page - 1) * perPage, page * perPage);

  const toggleActive = async (id: number) => {
    await fetch(`${API}/users/${id}/toggle-active`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };

  const createUser = async () => {
    setCreating(true);
    await fetch(`${API}/users`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    setCreating(false);
    setShowCreate(false);
    setNewUser({ username: '', email: '', role: 'moderator', password: '' });
    fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Users</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-white text-[12px] font-medium hover:bg-[#222] transition-all">
          {showCreate ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 mb-6">
          <h3 className="text-[13px] font-medium text-white mb-4">New User</h3>
          <div className="space-y-3 max-w-md">
            <Field label="Username" value={newUser.username} onChange={v => setNewUser(u => ({ ...u, username: v }))} />
            <Field label="Email" value={newUser.email} onChange={v => setNewUser(u => ({ ...u, email: v }))} />
            <Field label="Password" value={newUser.password} onChange={v => setNewUser(u => ({ ...u, password: v }))} />
            <div>
              <label className="text-[12px] font-medium text-[#888] mb-1.5 block">Role</label>
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[12px] text-[#CCC] focus:outline-none focus:border-[#7c3aed]/40 transition-colors">
                <option value="moderator">Moderator</option>
                <option value="analyst">Analyst</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button onClick={createUser} disabled={creating}
              className="h-9 px-4 rounded-lg bg-white text-[#0a0a0a] text-[12px] font-medium hover:bg-[#e8e8e8] transition-all disabled:opacity-50">
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-20 text-center text-[#444] text-sm">No users</div>
      ) : (
        <>
          <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
            {paginatedUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#151515] border border-[#222] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#7c3aed]">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-[13px] text-[#CCC] font-medium">{u.username}</div>
                    <div className="text-[11px] text-[#555]">{u.email} · {u.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <button onClick={() => toggleActive(u.id)}
                    className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                      u.is_active ? 'bg-[#151515] text-[#888] hover:text-white' : 'bg-red-500/10 text-red-400'
                    }`}>{u.is_active ? 'Active' : 'Disabled'}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] disabled:opacity-30 hover:text-white transition-colors">← Previous</button>
            <span className="text-[12px] text-[#444]">Page {page}</span>
            <button disabled={paginatedUsers.length < perPage} onClick={() => setPage(p => p + 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] disabled:opacity-30 hover:text-white transition-colors">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Audit Log ──
function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const limit = 50;
  const token = getStoredToken();

  useEffect(() => {
    fetch(`${API}/audit-logs?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setLogs(d.data || []));
  }, [page]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white tracking-tight mb-6">Audit Log</h1>

      {logs.length === 0 ? (
        <div className="py-20 text-center text-[#444] text-sm">No audit logs</div>
      ) : (
        <>
          <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
            {logs.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-[#888]">{l.username || 'system'}</span>
                  <span className="text-[12px] text-[#CCC]">{l.action}</span>
                  {l.resource_type && <span className="text-[11px] text-[#555]">{l.resource_type} #{l.resource_id}</span>}
                </div>
                <span className="text-[11px] text-[#444]">{l.created_at?.slice(0, 16)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] disabled:opacity-30 hover:text-white transition-colors">← Previous</button>
            <span className="text-[12px] text-[#444]">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="h-8 px-3 rounded-lg bg-[#1a1a1a] text-[#666] text-[12px] hover:text-white transition-colors">Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Settings ──
function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [twoFA, setTwoFA] = useState({ setup: false, qr: '', secret: '', code: '', enabled: false });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const token = getStoredToken();

  useEffect(() => {
    fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setSettings(d.data.settings || {}));
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setProfile({ username: d.data.user.username, email: d.data.user.email }); setTwoFA(t => ({ ...t, enabled: d.data.user.totp_enabled })); });
  }, []);

  const save = async () => {
    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  const updateProfile = async () => {
    if (!passwords.current) { setMsg({ type: 'error', text: 'Password required' }); return; }
    const res = await fetch(`${API}/auth/profile`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username, email: profile.email, current_password: passwords.current }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ type: 'success', text: 'Profile updated' }); setPasswords(p => ({ ...p, current: '' })); }
    else setMsg({ type: 'error', text: d.error });
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (passwords.new.length < 6) { setMsg({ type: 'error', text: 'Password too short' }); return; }
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ type: 'success', text: 'Password changed' }); setPasswords({ current: '', new: '', confirm: '' }); }
    else setMsg({ type: 'error', text: d.error });
  };

  const setup2FA = async () => {
    const res = await fetch(`${API}/auth/2fa/setup`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.data) { setTwoFA(t => ({ ...t, setup: true, qr: d.data.qr, secret: d.data.secret })); }
  };

  const enable2FA = async () => {
    const res = await fetch(`${API}/auth/2fa/enable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: twoFA.code }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ type: 'success', text: '2FA enabled!' }); setTwoFA(t => ({ ...t, enabled: true, setup: false, code: '' })); fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setTwoFA(t => ({ ...t, enabled: d.data.user.totp_enabled }))); }
    else setMsg({ type: 'error', text: d.error });
  };

  const disable2FA = async () => {
    if (!confirm('Disable 2FA?')) return;
    const res = await fetch(`${API}/auth/2fa/disable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwords.current }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ type: 'success', text: '2FA disabled' }); setTwoFA(t => ({ ...t, enabled: false })); }
    else setMsg({ type: 'error', text: d.error });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
        <button onClick={save}
          className={`h-8 px-4 rounded-lg text-[12px] font-medium transition-all ${
            saved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
          }`}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {msg.text && <div className={`mb-4 p-3 rounded-lg text-[12px] ${msg.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{msg.text}</div>}

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>👤</span> Profile
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[11px] text-[#555] block mb-1">Username</label><input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
              <div><label className="text-[11px] text-[#555] block mb-1">Email</label><input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
            </div>
            <div><label className="text-[11px] text-[#555] block mb-1">Current Password (required to change profile)</label><input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
            <button onClick={updateProfile} className="h-8 px-4 rounded-lg bg-[#7c3aed] text-white text-[12px] font-medium">Update Profile</button>
          </div>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>🔒</span> Change Password
          </h3>
          <div className="space-y-4">
            <div><label className="text-[11px] text-[#555] block mb-1">Current Password</label><input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[11px] text-[#555] block mb-1">New Password</label><input type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
              <div><label className="text-[11px] text-[#555] block mb-1">Confirm</label><input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
            </div>
            <button onClick={changePassword} className="h-8 px-4 rounded-lg bg-[#7c3aed] text-white text-[12px] font-medium">Change Password</button>
          </div>
        </div>

        {/* 2FA */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>🛡️</span> Two-Factor Authentication
          </h3>
          {twoFA.enabled ? (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-emerald-400">2FA is enabled</span>
              <button onClick={disable2FA} className="h-8 px-4 rounded-lg border border-red-500/30 text-red-400 text-[12px]">Disable</button>
            </div>
          ) : twoFA.setup ? (
            <div className="space-y-4">
              <img src={twoFA.qr} alt="QR Code" className="w-40 h-40 rounded-lg" />
              <p className="text-[11px] text-[#666]">Secret: <code className="text-[#a78bfa]">{twoFA.secret}</code></p>
              <div><label className="text-[11px] text-[#555] block mb-1">Enter code from authenticator app</label><input value={twoFA.code} onChange={e => setTwoFA(t => ({ ...t, code: e.target.value }))} className="w-full h-9 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" /></div>
              <div className="flex gap-2">
                <button onClick={enable2FA} className="h-8 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-medium">Enable 2FA</button>
                <button onClick={() => setTwoFA(t => ({ ...t, setup: false }))} className="h-8 px-4 rounded-lg border border-[#222] text-[#666] text-[12px]">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={setup2FA} className="h-8 px-4 rounded-lg bg-[#7c3aed] text-white text-[12px] font-medium">Setup 2FA</button>
          )}
        </div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
        <button onClick={save}
          className={`h-8 px-4 rounded-lg text-[12px] font-medium transition-all ${
            saved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
          }`}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Featured Payments */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">★</span> Featured Payments
          </h3>
          <div className="space-y-4">
            <Field label="Solana USDC Wallet Address" value={settings.solana_usdc_wallet || ''} onChange={v => update('solana_usdc_wallet', v)}
              hint="Users send USDC here to get featured" />
            <Field label="Featured Price (USDC)" value={settings.featured_price_usdc || ''} onChange={v => update('featured_price_usdc', v)}
              hint="Amount in USDC displayed on the featured page" />
          </div>
        </div>

        {/* Site Info */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>◎</span> Site Info
          </h3>
          <div className="space-y-4">
            <Field label="Site Name" value={settings.site_name || 'hermeseco'} onChange={v => update('site_name', v)}
              hint="Name displayed in hero and branding" />
            <Field label="Tagline" value={settings.site_tagline || ''} onChange={v => update('site_tagline', v)}
              hint="Short tagline under the site name" />
          </div>
        </div>

        {/* CTA Section (bottom of homepage) */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>◆</span> Homepage CTA Section
          </h3>
          <div className="space-y-4">
            <Field label="CTA Title" value={settings.cta_title || 'Built with hermeseco?'} onChange={v => update('cta_title', v)}
              hint="Title of the bottom CTA section on homepage" />
            <Field label="CTA Description" value={settings.cta_description || ''} onChange={v => update('cta_description', v)}
              hint="Description text under the CTA title" />
            <Field label="CTA Filename" value={settings.cta_file_name || '.hermeseco.json'} onChange={v => update('cta_file_name', v)}
              hint="Filename shown in code block for users to add to their repo" />
          </div>
        </div>

        {/* Crawler Config */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>◎</span> Crawler Config
          </h3>
          <div className="space-y-4">
            <Field label="Crawler Schedule (CRON)" value={settings.crawler_schedule || '0 2 * * *'} onChange={v => update('crawler_schedule', v)}
              hint="When the crawler runs automatically via GitHub Actions" />
            <Field label="Max Repos Per Crawl" value={settings.max_crawl_results || '30'} onChange={v => update('max_crawl_results', v)}
              hint="Limit repos per crawl to stay within GitHub API rate limits" />
            <Field label="Auto-Verify Threshold" value={settings.auto_verify_threshold || '0.75'} onChange={v => update('auto_verify_threshold', v)}
              hint="Min verification score (0-1) to auto-approve crawled resources" />
          </div>
        </div>

        {/* GitHub Token */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="text-[13px] font-medium text-white mb-4 flex items-center gap-2">
            <span>⚡</span> GitHub API
          </h3>
          <div className="space-y-4">
            <Field label="GitHub Personal Access Token"
              value={settings.github_token || ''}
              onChange={v => update('github_token', v)}
              hint="Increases rate limit to 5000/hr. Create at github.com/settings/tokens" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Featured Requests ──
function FeaturedRequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('pending');
  const [processing, setProcessing] = useState<Record<number, string | null>>(null);
  const token = getStoredToken();

  const fetchItems = () => {
    fetch(`${API}/featured-requests?status=${status}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setItems(d.data || []));
  };

  useEffect(() => { fetchItems(); }, [status]);

  const doAction = async (id: number, action: 'approve' | 'reject' | 'toggle-paid') => {
    setProcessing(p => ({ ...p, [id]: action }));
    await fetch(`${API}/featured-requests/${id}/${action}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    setProcessing(p => ({ ...p, [id]: null }));
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Featured Requests</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-all ${
              status === s ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]'
            }`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-[#444] text-sm">No featured requests</div>
      ) : (
        <div className="rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
          {items.map((r: any) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#CCC] font-medium">{r.resource_name}</span>
                  {r.paid && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Paid</span>}
                </div>
                <div className="text-[11px] text-[#555] mt-0.5">{r.github_url} · {r.email}</div>
                {r.message && <div className="text-[11px] text-[#444] mt-0.5 truncate">{r.message}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-[#444] hidden sm:block">{r.created_at?.slice(0, 10)}</span>
                {r.status === 'pending' && (
                  <>
                    <button disabled={processing[r.id] !== null} onClick={() => doAction(r.id, 'approve')}
                      className="h-8 px-3 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                      {processing[r.id] === 'approve' ? '...' : 'Approve & Feature'}
                    </button>
                    <button disabled={processing[r.id] !== null} onClick={() => doAction(r.id, 'reject')}
                      className="h-8 px-3 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {processing[r.id] === 'reject' ? '...' : 'Reject'}
                    </button>
                  </>
                )}
                {r.status !== 'pending' && (
                  <span className={`text-[11px] px-2 py-0.5 rounded capitalize ${
                    r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>{r.status}</span>
                )}
                <button onClick={() => doAction(r.id, 'toggle-paid')}
                  className={`h-8 px-2 rounded text-[11px] transition-all ${
                    r.paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#151515] text-[#555] hover:text-white'
                  }`}>{r.paid ? '$' : '○'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analyze Repo ──
function AnalyzePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const token = getStoredToken();

  const TYPES_MAP: Record<string, { label: string; icon: string; desc: string }> = {
    agent: { label: 'Agent', icon: '🤖', desc: 'Autonomous AI that reasons & acts on its own' },
    skill: { label: 'Skill', icon: '🛠️', desc: 'Reusable procedure the agent learns & improves' },
    tool: { label: 'Tool', icon: '🔧', desc: 'Individual capability the agent can call' },
    integration: { label: 'Integration', icon: '🔌', desc: 'Connector to an external service or API' },
    workflow: { label: 'Workflow', icon: '⚙️', desc: 'Multi-step automation recipe' },
    'memory-system': { label: 'Memory System', icon: '🧠', desc: 'Persistent knowledge & context store' },
    'model-config': { label: 'Model Config', icon: '🎯', desc: 'Prompt template, personality, or routing strategy' },
    router: { label: 'Router', icon: '🔄', desc: 'Orchestration layer across agents & data sources' },
  };

  const analyze = async () => {
    setError('');
    setAnalysis(null);
    setSubmitted(false);
    if (!url.match(/github\.com\/[^/]+\/[^/]+/)) {
      setError('Enter a valid GitHub URL (https://github.com/owner/repo)');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API}/resources/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: url.trim().replace(/\/$/, '') }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDirectly = async () => {
    if (!analysis) return;
    setSubmitting(true);
    try {
      const resp = await fetch(`${API}/resources/add-analyzed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to add');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Analyze & Add Repo</h1>
      </div>

      <div className="p-4 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5 mb-6">
        <p className="text-[12px] text-[#c4b5fd] leading-relaxed">
          Paste any public GitHub repo URL. The analyzer fetches its structure, auto-detects the resource type, extracts tools & tags, and generates a summary. Review the results then add it directly to the registry.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">🔗</span>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="https://github.com/owner/repo"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#111] border border-[#1e1e1e] text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#7c3aed]/40 transition-colors"
          />
        </div>
        <button onClick={analyze} disabled={loading}
          className="flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50 whitespace-nowrap">
          {loading ? '...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 mb-6">
          <span className="text-[12px] text-red-400">{error}</span>
        </div>
      )}

      {submitted && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mb-6">
          <span className="text-[13px] text-emerald-400 font-medium">Added to registry successfully!</span>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Stars', value: analysis.stars },
              { label: 'Forks', value: analysis.forks },
              { label: 'Files', value: analysis.file_count },
              { label: 'Language', value: analysis.language || '?' },
              { label: 'Issues', value: analysis.open_issues },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] text-center">
                <div className="text-base font-semibold text-white tabular-nums">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                <div className="text-[10px] text-[#555] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-[#7c3aed]/20 bg-[#7c3aed]/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-[#c4b5fd]">Detected Type</span>
              {analysis.type_auto_detected ? (
                <span className="text-[10px] text-[#888] bg-[#151515] px-2 py-0.5 rounded">Auto-detected ({Math.round(analysis.type_confidence * 100)}%)</span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">From .hermes-eco.json</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{TYPES_MAP[analysis.type]?.icon}</span>
              <span className="text-[14px] font-medium text-white">{TYPES_MAP[analysis.type]?.label}</span>
            </div>
            <p className="text-[11px] text-[#888] mt-1">{TYPES_MAP[analysis.type]?.desc}</p>
          </div>

          {analysis.key_files?.length > 0 && (
            <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
              <h4 className="text-[12px] font-medium text-[#888] mb-2">Key Files</h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.key_files.map((f: string) => (
                  <span key={f} className="text-[10px] text-[#888] bg-[#151515] px-2 py-1 rounded border border-[#1a1a1a] font-mono">{f}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.tools_used?.length > 0 && (
            <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
              <h4 className="text-[12px] font-medium text-[#888] mb-2">Tools & Capabilities</h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.tools_used.map((t: string) => (
                  <span key={t} className="text-[11px] text-[#a78bfa] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2 py-1 rounded">{t.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.long_description && (
            <div className="p-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
              <h4 className="text-[12px] font-medium text-[#888] mb-2">Auto-Generated Summary</h4>
              <p className="text-[12px] text-[#BBB] leading-relaxed">{analysis.long_description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {analysis.license && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                <span className="text-[11px] text-[#555]">License</span>
                <span className="text-[12px] text-[#DDD]">{analysis.license}</span>
              </div>
            )}
            {analysis.author_github && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                <span className="text-[11px] text-[#555]">Author</span>
                <span className="text-[12px] text-[#DDD]">@{analysis.author_github}</span>
              </div>
            )}
            {analysis.last_commit_date && (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
                <span className="text-[11px] text-[#555]">Last commit</span>
                <span className="text-[12px] text-[#DDD]">{new Date(analysis.last_commit_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {analysis.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.tags.map((t: string) => (
                <span key={t} className="text-[11px] text-[#555] bg-[#151515] px-2 py-1 rounded">#{t}</span>
              ))}
            </div>
          )}

          <button onClick={addDirectly} disabled={submitting}
            className="w-full h-10 rounded-lg bg-white text-[#0a0a0a] font-medium text-[13px] hover:bg-[#e8e8e8] transition-colors disabled:opacity-50">
            {submitting ? 'Adding...' : 'Add to Registry'}
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-[#151515] rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]" />)}
      </div>
      <div className="h-32 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]" />
    </div>
  );
}

function BulkActionButton({ onClick, label, description }: { onClick: () => void; label: string; description: string }) {
  const [running, setRunning] = useState(false);
  const handle = async () => {
    setRunning(true);
    await onClick();
    setRunning(false);
  };
  return (
    <button onClick={handle} disabled={running}
      className="group flex items-start gap-3 h-auto p-3 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#7c3aed]/30 hover:bg-[#7c3aed]/5 transition-all disabled:opacity-50">
      <div className="w-8 h-8 rounded-md bg-[#111] border border-[#222] flex items-center justify-center text-[#7c3aed] group-hover:border-[#7c3aed]/40 transition-colors">
        ⚡
      </div>
      <div className="text-left">
        <div className="text-[12px] font-medium text-white">{label}</div>
        <div className="text-[10px] text-[#666]">{description}</div>
      </div>
    </button>
  );
}

// ── Categories Page ──
function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', type: 'usecase', description: '', icon: '' });
  const token = getStoredToken();

  useEffect(() => {
    fetch(`${API}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCategories(d.data || [])).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API}/categories/${editing.id}` : `${API}/categories`;
    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const res = await fetch(`${API}/categories`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setCategories(d.data || []);
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', slug: '', type: 'usecase', description: '', icon: '' });
  };

  const del = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCategories(categories.filter(c => c.id !== id));
  };

  if (loading) return <div className="p-6 text-[#666]">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Categories</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', type: 'usecase', description: '', icon: '' }); }}
          className="h-9 px-4 rounded-lg bg-white text-[#0a0a0a] text-[13px] font-medium hover:bg-[#e8e8e8]">
          + Add Category
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/5 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="Name" className="h-10 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" />
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="slug" className="h-10 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-10 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]">
              <option value="usecase">Use Case</option>
              <option value="resource_type">Resource Type</option>
            </select>
            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="Emoji (e.g. 🔌)" className="h-10 px-3 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full mb-4 px-3 py-2 rounded-lg bg-[#111] border border-[#222] text-white text-[13px]" />
          <div className="flex gap-2">
            <button onClick={save} className="h-9 px-4 rounded-lg bg-white text-[#0a0a0a] text-[13px] font-medium">{editing ? 'Update' : 'Create'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="h-9 px-4 rounded-lg border border-[#222] text-[#888] text-[13px]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.length === 0 && <p className="text-[#666] text-[13px]">No categories yet</p>}
        {categories.map(c => (
          <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d]">
            <div className="flex items-center gap-3">
              <span className="text-lg">{c.icon || '🏷'}</span>
              <div>
                <div className="text-[13px] font-medium text-white">{c.name}</div>
                <div className="text-[11px] text-[#555]">{c.slug} · {c.type}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(c); setForm({ name: c.name, slug: c.slug, type: c.type, description: c.description || '', icon: c.icon || '' }); setShowForm(true); }} className="text-[11px] text-[#888] hover:text-white">Edit</button>
              <button onClick={() => del(c.id)} className="text-[11px] text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
