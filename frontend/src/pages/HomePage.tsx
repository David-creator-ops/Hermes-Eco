import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, Command, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { AgentCard } from '../components/agent/AgentCard';
import { SearchBar } from '../components/search/SearchBar';

const RESOURCE_TYPES = [
  { name: 'Agents', slug: 'agent', icon: '🤖', description: 'Autonomous AI systems that reason, use tools, and complete tasks on their own', count: 0, color: 'from-purple-500/20 to-purple-600/5' },
  { name: 'Skills', slug: 'skill', icon: '🛠️', description: 'Reusable procedures agents learn and improve — like muscle memory for AI', count: 0, color: 'from-blue-500/20 to-blue-600/5' },
  { name: 'Tools', slug: 'tool', icon: '🔧', description: 'Individual capabilities agents can call — search, code exec, file ops, and more', count: 0, color: 'from-emerald-500/20 to-emerald-600/5' },
  { name: 'Integrations', slug: 'integration', icon: '🔌', description: 'Connect Hermes to external services — APIs, databases, messaging platforms', count: 0, color: 'from-amber-500/20 to-amber-600/5' },
  { name: 'Workflows', slug: 'workflow', icon: '⚙️', description: 'Multi-step automation recipes — chain agents, tools, and decisions together', count: 0, color: 'from-rose-500/20 to-rose-600/5' },
  { name: 'Memory Systems', slug: 'memory-system', icon: '🧠', description: 'Persistent knowledge stores — vector DBs, embeddings, and context recall', count: 0, color: 'from-indigo-500/20 to-indigo-600/5' },
  { name: 'Model Configs', slug: 'model-config', icon: '🎯', description: 'Prompt templates, personality files, and model routing strategies', count: 0, color: 'from-cyan-500/20 to-cyan-600/5' },
  { name: 'Routers', slug: 'router', icon: '🔄', description: 'Orchestration layers that route queries across agents and data sources', count: 0, color: 'from-orange-500/20 to-orange-600/5' },
];

const USE_CATEGORIES = [
  { name: 'Data & Analysis', slug: 'data-analysis', icon: '\ud83d\udcca', color: 'text-emerald-400' },
  { name: 'Automation', slug: 'automation', icon: '\u26a1', color: 'text-amber-400' },
  { name: 'Code & Development', slug: 'code-dev', icon: '\ud83d\udcbb', color: 'text-blue-400' },
  { name: 'Web & Browser', slug: 'web-browser', icon: '\ud83c\udf10', color: 'text-cyan-400' },
  { name: 'Content & Writing', slug: 'content', icon: '\u270d\ufe0f', color: 'text-rose-400' },
  { name: 'DevOps & Infra', slug: 'devops', icon: '\ud83d\udd27', color: 'text-orange-400' },
  { name: 'Communication', slug: 'communication', icon: '\ud83d\udcac', color: 'text-violet-400' },
  { name: 'Security', slug: 'security', icon: '\ud83d\udd10', color: 'text-red-400' },
  { name: 'AI & ML', slug: 'ai-ml', icon: '\ud83e\uddea', color: 'text-pink-400' },
  { name: 'Research', slug: 'research', icon: '\ud83d\udd0d', color: 'text-indigo-400' },
  { name: 'Enterprise', slug: 'enterprise', icon: '\ud83c\udfe2', color: 'text-slate-400' },
  { name: 'Creative', slug: 'creative', icon: '\ud83c\udfa8', color: 'text-yellow-400' },
];

export function HomePage() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.getStats });
  const { data: featured } = useQuery({ queryKey: ['featured'], queryFn: api.getFeatured });
  const { data: recent } = useQuery({ queryKey: ['recent'], queryFn: api.getRecent });
  const s = stats?.data;

  // API returns singular (agent, tool, workflow) but RESOURCE_TYPES uses plural slugs
  // Create plural-to-singular mapping
  const pluralMap: Record<string, string> = {
    'agents': 'agent',
    'skills': 'skill',
    'tools': 'tool',
    'integrations': 'integration',
    'workflows': 'workflow',
    'memory-systems': 'memory-system',
    'model-configs': 'model-config',
    'routers': 'router',
  };
  const resourceStats = s?.resource_types || [];
  const resourceTypeMap: Record<string, number> = {};
  for (const r of resourceStats) {
    resourceTypeMap[r.resource_type] = r.count;
  }

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative pt-16 pb-6 md:pt-20 md:pb-8">
        <div className="noise-bg">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.02) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.02) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, black 20%, transparent 100%)',
          }} />
          <div className="glow-purple -top-40 left-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 h-6 px-2.5 rounded-full bg-[#151515] border border-[#222] text-[11px] text-[#888] mb-6">
            <Sparkles className="w-3 h-3 text-[#a78bfa]" />
            <span>{s?.total_agents || '---'} resources</span>
            <span className="w-px h-2.5 bg-[#333]" />
            <span className="text-[#666]">{s?.verified_agents || '---'} verified</span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-delay text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.15] mb-4">
            <span className="text-gradient">The Hub for</span>
            <br />
            <span className="text-gradient-accent">Hermes Resources</span>
          </h1>

          <p className="animate-fade-in-delay-2 text-[14px] text-[#707070] max-w-md mx-auto leading-relaxed mb-8">
            Discover agents, skills, tools, workflows, and more —
            all built for the Hermes ecosystem.
          </p>

          <div className="animate-fade-in-delay-2 flex justify-center mb-8">
            <SearchBar large />
          </div>

          <div className="animate-fade-in-delay-2 flex items-center justify-center gap-3">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-white text-[13px] font-medium text-[#0a0a0a] hover:bg-[#e8e8e8] transition-colors"
            >
              Browse all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-[#151515] text-[13px] font-medium text-white/90 hover:bg-[#1a1a1a] border border-[#222] transition-all"
            >
              <Command className="w-3.5 h-3.5" />
              Submit resource
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-t border-[#141414] border-b border-[#141414]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-4 gap-4">
            <StatItem value={s?.total_agents ?? '---'} label="Resources" />
            <StatItem value={s?.verified_agents ?? '---'} label="Verified" />
            <StatItem value={`${s?.avg_verification_score || '0'}/8`} label="Avg Score" />
            <StatItem value={s?.new_agents_this_month ?? '---'} label="New This Month" />
          </div>
        </div>
      </section>

      {/* ── RESOURCE TYPES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white tracking-tight mb-0.5">Browse by Type</h2>
            <p className="text-[12px] text-[#666]">8 resource categories</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RESOURCE_TYPES.map((rt) => {
            const count = resourceTypeMap[rt.slug] ?? 0;
            return (
              <Link
                key={rt.slug}
                to={`/browse?resource_type=${rt.slug}`}
                className={`group relative block p-3.5 rounded-xl border border-[#1a1a1a] bg-gradient-to-br ${rt.color} hover:border-[#333] transition-all duration-300`}
              >
                <div className="relative z-10">
                  <span className="text-2xl mb-1.5 block">{rt.icon}</span>
                  <span className="text-[13px] font-medium text-white/90 group-hover:text-white transition-colors">
                    {rt.name}
                  </span>
                  <span className="block text-[10px] text-[#666] mt-0.5 leading-snug">{rt.description}</span>
                  <span className="block text-[11px] text-[#555] mt-1">{count} resources</span>
                </div>
              </Link>
            );
          })}

          {/* Get Featured CTA Card */}
          <Link
            to="/featured"
            className="group relative block p-3.5 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] to-transparent hover:border-amber-500/40 transition-all duration-300"
          >
            <div className="relative z-10">
              <span className="text-2xl mb-1.5 block">★</span>
              <span className="text-[13px] font-medium text-amber-300 group-hover:text-amber-200 transition-colors">
                Get Featured
              </span>
              <span className="block text-[11px] text-amber-400/50 mt-0.5">Stand out from the crowd</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ── FEATURED ── */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight mb-0.5">Featured</h2>
              <p className="text-[12px] text-[#666]">Stand out from the crowd — get your resource highlighted in gold</p>
            </div>
            {featured?.data && featured.data.length > 0 && (
              <Link to="/browse?sort=featured" className="flex items-center gap-1 text-[12px] text-[#888] hover:text-white transition-colors mt-0.5 group">
                View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {featured?.data && featured.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.data.map((a: any) => (
                <AgentCard key={a.id} agent={a} featured />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">★</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Featured</h3>
              <p className="text-[13px] text-[#888] max-w-md mx-auto mb-5 leading-relaxed">
                Want your agent, skill, tool, or workflow showcased at the top?
                Featured resources get prime placement, a gold border badge, and more visibility from the community.
              </p>
              <Link
                to="/featured"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/25 text-amber-300 text-[13px] font-medium hover:from-amber-500/30 hover:to-amber-400/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Become Featured
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── USE CASE CATEGORIES ── */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight mb-0.5">Use Cases</h2>
              <p className="text-[12px] text-[#666]">Find resources by what you want to build</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {USE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/browse?category_slug=${cat.slug}`}
                className="group flex items-center gap-3 h-10 px-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#333] hover:bg-[#111] transition-all duration-300"
              >
                <span className="text-sm">{cat.icon}</span>
                <span className="text-[12px] text-[#999] group-hover:text-white transition-colors truncate">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT ── */}
      {recent?.data && recent.data.length > 0 && (
        <section className="border-t border-[#1a1a1a]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-white tracking-tight mb-0.5">Recently added</h2>
                <p className="text-[12px] text-[#666]">Fresh resources in the registry</p>
              </div>
              <Link to="/browse?sort=recent" className="flex items-center gap-1 text-[12px] text-[#888] hover:text-white transition-colors mt-0.5 group">
                View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.data.slice(0, 6).map((a: any) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-3">
            Built with hermeseco?
          </h2>
          <p className="text-[#707070] max-w-md mx-auto mb-6 text-[13px] leading-relaxed">
            Add a <code className="text-[12px] bg-[#151515] text-[#CCC] px-1.5 py-0.5 rounded border border-[#222] font-mono">.hermeseco.json</code> file to your repo —
            that&apos;s it.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-[#151515] text-[13px] font-medium text-white/90 hover:bg-[#1a1a1a] border border-[#222] transition-all duration-200"
          >
            Submit your project <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-left">
      <div className="text-base font-semibold text-white tabular-nums">{value}</div>
      <div className="text-[10px] text-[#555]">{label}</div>
    </div>
  );
}
