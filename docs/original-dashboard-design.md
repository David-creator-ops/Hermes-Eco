# Admin Dashboard - Original Design (Pre-Analytics Upgrade)

Date: April 6, 2026
File: backend/src/routes/adminRoutes.ts + frontend/src/pages/AdminConsole.tsx

## Original Dashboard API Endpoint (adminRoutes.ts lines 39-65)

```ts
router.get('/dashboard', requireAuth(), (req: Request, res: Response) => {
  try {
    const totals = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM agents WHERE is_archived = 0) as total_resources,
        (SELECT COUNT(*) FROM submissions WHERE status = 'pending') as pending_submissions,
        (SELECT COUNT(*) FROM agents WHERE verification_status = 'verified') as verified,
        (SELECT COUNT(*) FROM crawler_runs) as total_crawls
    `).get() as any;

    const recent = db.prepare(
      "SELECT id, resource_name, resource_type, source, status, submitted_at FROM submissions ORDER BY submitted_at DESC LIMIT 10"
    ).all() as any[];

    const crawlerRuns = db.prepare(
      "SELECT id, status, resources_found, resources_processed, started_at FROM crawler_runs ORDER BY started_at DESC LIMIT 5"
    ).all() as any[];

    const byType = db.prepare(
      "SELECT resource_type, COUNT(*) as count FROM agents WHERE is_archived = 0 GROUP BY resource_type ORDER BY count DESC"
    ).all() as any[];

    res.json({ data: { totals, recent, crawler_runs: crawlerRuns, by_type: byType } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

Returns: totals, recent, crawler_runs, by_type

## Original DashboardPage Component (AdminConsole.tsx lines 170-257)

```tsx
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
    { label: 'Total Resources', value: t?.total_resources || 0, color: 'text-white' },
    { label: 'Pending Review', value: t?.pending_submissions || 0, color: 'text-amber-400' },
    { label: 'Verified', value: t?.verified || 0, color: 'text-emerald-400' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-white tracking-tight mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="p-5 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <div className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
            <div className="text-[12px] text-[#555] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* By resource type */}
      {data?.by_type?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[13px] font-medium text-white mb-3">Resources by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.by_type.map((rt: any) => (
              <div key={rt.resource_type} className="p-3 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="text-lg font-bold text-white tabular-nums">{rt.count}</div>
                <div className="text-[11px] text-[#555] capitalize">{rt.resource_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {data?.recent?.length > 0 && (
        <div className="mb-8">
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

      {/* Crawler */}
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
  );
}
```

## Original Stats Display
- 3 stat cards: Total Resources, Pending Review, Verified
- Resources by type grid (2-4 columns)
- Recent submissions list
- Recent crawler runs list

## To Revert
Replace the current dashboard API in backend/src/routes/adminRoutes.ts with the code above (lines 39-65).
Replace the DashboardPage function in frontend/src/pages/AdminConsole.tsx with the code above.
