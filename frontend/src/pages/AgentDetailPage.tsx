import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, GitBranch, Calendar, Github, ExternalLink, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { AgentCard } from '../components/agent/AgentCard';
import { useState } from 'react';
import { formatDate } from '../lib/utils';

export function AgentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['agent', slug],
    queryFn: () => api.getAgentBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
  const { data: recent } = useQuery({ queryKey: ['recent'], queryFn: api.getRecent });

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 animate-pulse"><div className="h-5 w-16 bg-white/[0.04] rounded mb-8" /><div className="h-8 w-72 bg-white/[0.04] rounded mb-3" /><div className="h-4 w-96 bg-white/[0.04] rounded" /></div>;
  if (!data?.data) return <div className="max-w-6xl mx-auto px-4 py-20"><Link to="/browse" className="text-white hover:underline">← Browse</Link><p className="mt-6 text-lg text-white">Resource not found</p></div>;

  const a = data.data;
  const checks = a.verification_checks || {};
  const passed = Object.values(checks).filter(Boolean).length;
  const isVerified = a.verification_score >= 0.75;

  const checkList = [
    { key: 'has_hermes_dependency', label: 'Hermes dependency' },
    { key: 'has_hermes_import', label: 'Hermes imports in code' },
    { key: 'readme_mentions_hermes', label: 'README mentions Hermes' },
    { key: 'has_valid_metadata', label: 'Valid .hermeseco.json' },
    { key: 'not_a_fork', label: 'Original repository' },
    { key: 'has_tests', label: 'Test suite present' },
    { key: 'has_license', label: 'License file' },
    { key: 'readme_detailed', label: 'README has instructions' },
  ];

  const resourceConfig: Record<string, { label: string; emoji: string; bg: string }> = {
    agent: { label: 'Agent', emoji: '🤖', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    skill: { label: 'Skill', emoji: '🛠️', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    tool: { label: 'Tool', emoji: '🔧', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    integration: { label: 'Integration', emoji: '🔌', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    workflow: { label: 'Workflow', emoji: '⚙️', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    'memory-system': { label: 'Memory System', emoji: '🧠', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    'model-config': { label: 'Model Config', emoji: '🎯', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    router: { label: 'Router', emoji: '🔄', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  };

  const rt = resourceConfig[a.resource_type] || resourceConfig.agent;

  const isFeatured = a.is_featured === 1;

  return (
    <div className={isFeatured ? `border-t-2 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.08)]` : ""}>
      {/* Banner */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Link to="/browse" className="text-[12px] text-[#555] hover:text-white flex items-center gap-1 mb-6 transition-colors">
            ← Back
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${rt.bg}`}>
                  {rt.emoji} {rt.label}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                ) : a.verification_score >= 0.5 ? (
                  <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Community</span>
                ) : (
                  <span className="text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Unverified</span>
                )}
              </div>

              {isFeatured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded mb-3">
                  &#9733; Featured
                </span>
              )}

              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-2">{a.name}</h1>
              <p className="text-[13px] text-[#888] max-w-xl leading-relaxed mb-4">{a.description}</p>

              <div className="flex items-center gap-5 text-[12px] text-[#555]">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#888]" /> {a.stars.toLocaleString()}</span>
                <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> {a.forks}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(a.updated_at)}</span>
                {a.complexity_level && <span className="text-[#666]">{a.complexity_level}</span>}
                {a.deployment_type && <span className="text-[#666]">{a.deployment_type}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={a.repository_url} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 h-9 px-4 rounded-md text-[12px] text-[#888] hover:text-white border border-[#222] hover:bg-[#151515] transition-all">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
              {a.homepage_url && (
                <a href={a.homepage_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1.5 h-9 px-4 rounded-md text-[12px] text-[#888] hover:text-white border border-[#222] hover:bg-[#151515] transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Demo
                </a>
              )}
              {a.resource_type === 'agent' && <InstallBtn a={a} />}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            {a.long_description && (
              <section>
                <h2 className="text-[13px] font-semibold text-white mb-3">About</h2>
                <p className="text-[13px] text-[#707070] leading-relaxed whitespace-pre-wrap">{a.long_description}</p>
              </section>
            )}

            {/* Install */}
            {a.resource_type === 'agent' && (
              <section>
                <h2 className="text-[13px] font-semibold text-white mb-3">Install</h2>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-3 font-mono text-[13px]">
                  <span className="text-[#555]">$ </span><span className="text-[#a78bfa]">hermes install agent:</span><span className="text-[#DDD]">{a.author_github}/{a.slug}</span>
                </div>
                {a.license && <p className="text-[12px] text-[#555] mt-2">License: <span className="text-[#888]">{a.license}</span>{a.hermes_version_required && <span className="text-[#555] ml-1">· Requires Hermes <code className="text-[#888]">{a.hermes_version_required}</code></span>}</p>}
              </section>
            )}

            {/* Dependencies */}
            {a.external_dependencies && a.external_dependencies.length > 0 && (
              <section>
                <h2 className="text-[13px] font-semibold text-white mb-3">Dependencies</h2>
                <div className="flex flex-wrap gap-1.5">
                  {a.external_dependencies.map((d: string) => (
                    <span key={d} className="text-[11px] text-[#888] bg-[#151515] px-2 py-1 rounded border border-[#1a1a1a]">{d}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Verification */}
            <section>
              <h2 className="text-[13px] font-semibold text-white mb-3">Verification · {passed}/8</h2>
              <div className="w-full h-1.5 bg-[#151515] rounded-full mb-4 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${isVerified ? 'bg-emerald-500' : a.verification_score >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${(passed / 8) * 100}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {checkList.map(c => {
                  const ok = !!checks[c.key];
                  return (
                    <div key={c.key} className={`flex items-center gap-2 px-3 py-2 rounded-md text-[12px] ${ok ? 'text-[#888]' : 'text-[#444]'}`}>
                      {ok ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-[#333] flex-shrink-0" />}
                      {c.label}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Details */}
            <div className="rounded-lg border border-[#1a1a1a] p-4">
              <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Details</h4>
              <StatRow label="Author" value={`@${a.author_github}`} />
              {a.resource_type && <StatRow label="Type" value={<span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${rt.bg}`}>{rt.label}</span>} />}
              {a.complexity_level && <StatRow label="Complexity" value={a.complexity_level} />}
              {a.deployment_type && <StatRow label="Deployment" value={a.deployment_type} />}
              {a.maintenance_status && <StatRow label="Status" value={a.maintenance_status} />}
              {a.license && <StatRow label="License" value={a.license} />}
              {a.hermes_version_required && <StatRow label="Hermes" value={<span className="font-mono text-[#a78bfa] text-[11px]">{a.hermes_version_required}</span>} />}
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-[#1a1a1a] p-4">
              <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Stats</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d0d0d] rounded-md p-3 text-center">
                  <div className="text-base font-semibold text-white">{a.stars.toLocaleString()}</div>
                  <div className="text-[10px] text-[#555]">Stars</div>
                </div>
                <div className="bg-[#0d0d0d] rounded-md p-3 text-center">
                  <div className="text-base font-semibold text-white">{a.forks}</div>
                  <div className="text-[10px] text-[#555]">Forks</div>
                </div>
                <div className="bg-[#0d0d0d] rounded-md p-3 text-center">
                  <div className="text-base font-semibold text-white">{a.watchers}</div>
                  <div className="text-[10px] text-[#555]">Watchers</div>
                </div>
              </div>
            </div>

            {/* Tools */}
            {a.tools_used && a.tools_used.length > 0 && (
              <div className="rounded-lg border border-[#1a1a1a] p-4">
                <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Tools Used</h4>
                <div className="flex flex-wrap gap-1.5">
                  {a.tools_used.map((t: string) => (
                    <span key={t} className="text-[11px] text-[#888] bg-[#151515] px-2 py-1 rounded border border-[#1a1a1a]">{t.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Required skills */}
            {a.required_skills && a.required_skills.length > 0 && (
              <div className="rounded-lg border border-[#1a1a1a] p-4">
                <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {a.required_skills.map((s: string) => (
                    <span key={s} className="text-[11px] text-[#999] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tier 2 categories */}
            {a.tier2_categories && a.tier2_categories.length > 0 && (
              <div className="rounded-lg border border-[#1a1a1a] p-4">
                <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Categories</h4>
                <div className="flex flex-wrap gap-1.5">
                  {a.tier2_categories.map((c: string) => (
                    <Link key={c} to={`/browse?category_slug=${c}`}
                      className="text-[11px] text-[#666] bg-[#151515] hover:bg-[#1a1a1a] hover:text-[#999] px-2 py-1 rounded border border-[#1a1a1a] transition-colors">
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {a.tags && a.tags.length > 0 && (
              <div className="rounded-lg border border-[#1a1a1a] p-4">
                <h4 className="text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {a.tags.map((t: string) => (
                    <Link key={t} to={`/browse?search=${t}`}
                      className="text-[11px] text-[#666] hover:text-[#7c3aed] px-2 py-1 rounded transition-colors">
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Related */}
        {recent?.data && recent.data.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#1a1a1a]">
            <h2 className="text-[15px] font-semibold text-white mb-6">Related</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.data.filter((x: any) => x.id !== a.id).slice(0, 4).map((x: any) => <AgentCard key={x.id} agent={x} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
      <span className="text-[12px] text-[#555]">{label}</span>
      <span className="text-[12px]">{value}</span>
    </div>
  );
}

function InstallBtn({ a }: { a: any }) {
  const [copied, setCopied] = useState(false);
  const cmd = `hermes install agent:${a.author_github}/${a.slug}`;
  const isFeatured = a.is_featured === 1;

  return (
    <button onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 h-9 px-4 rounded-md text-[12px] font-medium bg-white text-[#0a0a0a] hover:bg-[#e8e8e8] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Install'}
    </button>
  );
}
