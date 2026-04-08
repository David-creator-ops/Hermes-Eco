import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { api } from '../services/api';
import { AgentCard } from '../components/agent/AgentCard';
import { SearchInput } from '../components/search/SearchBar';

const RESOURCE_TYPES = [
  { label: 'All', value: '', icon: '📦', desc: 'All resources' },
  { label: 'Agents', value: 'agent', icon: '🤖', desc: 'Autonomous AI that reasons & acts' },
  { label: 'Skills', value: 'skill', icon: '🛠️', desc: 'Learned procedures that improve with use' },
  { label: 'Tools', value: 'tool', icon: '🔧', desc: 'Capabilities agents can call' },
  { label: 'Integrations', value: 'integration', icon: '🔌', desc: 'Connect to external services' },
  { label: 'Workflows', value: 'workflow', icon: '⚙️', desc: 'Multi-step automation chains' },
  { label: 'Memory', value: 'memory-system', icon: '🧠', desc: 'Persistent knowledge & context' },
  { label: 'Model Configs', value: 'model-config', icon: '🎯', desc: 'Prompts, personalities & routing' },
  { label: 'Routers', value: 'router', icon: '🔄', desc: 'Orchestrate across agents' },
];

const TIER2_CATS = [
  { label: 'Data & Analysis', value: 'Data & Analysis', icon: '📊' },
  { label: 'Automation', value: 'Automation', icon: '⚡' },
  { label: 'Code & Dev', value: 'Code & Development', icon: '💻' },
  { label: 'Web & Browser', value: 'Web & Browser', icon: '🌐' },
  { label: 'Content', value: 'Content & Writing', icon: '✍️' },
  { label: 'DevOps', value: 'DevOps & Infrastructure', icon: '🔧' },
  { label: 'Communication', value: 'Communication', icon: '💬' },
  { label: 'Security', value: 'Security', icon: '🔐' },
  { label: 'AI & ML', value: 'AI & ML', icon: '🧪' },
  { label: 'Research', value: 'Research', icon: '🔍' },
];

const COMPLEXITY = ['Beginner', 'Intermediate', 'Advanced'];
const DEPLOYMENT = ['Local', 'Cloud', 'Hybrid', 'Docker'];
const SORTS = [
  { label: 'Most recent', value: 'recent' },
  { label: 'Most popular', value: 'popular' },
  { label: 'Most stars', value: 'stars' },
  { label: 'Best verified', value: 'verified' },
];

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [openMobile, setOpenMobile] = useState(false);
  const [openDesktop, setOpenDesktop] = useState(true);
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.getStats });

  const rt = searchParams.get('resource_type') || '';
  const verification = searchParams.get('verification_status') || '';
  const category = searchParams.get('category_slug') || '';
  const sort = searchParams.get('sort') || 'recent';
  const complexity = searchParams.get('complexity_level') || '';
  const deploy = searchParams.get('deployment_type') || '';

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== searchParams.get('search')) {
        if (search) { searchParams.set('search', search); setSearchParams(searchParams); }
        else { searchParams.delete('search'); setSearchParams(searchParams); }
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const set = (k: string, v: string) => {
    if (v) searchParams.set(k, v); else searchParams.delete(k);
    setSearchParams({ ...Object.fromEntries(searchParams) });
  };

  const clear = () => { setSearchParams({}); setSearch(''); };
  const activeCount = [rt, verification, category, complexity, deploy, search].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ['agents', searchParams.toString()],
    queryFn: () => api.listAgents({
      page: searchParams.get('page') || '1', limit: '24',
      ...(sort && { sort }), ...(rt && { resource_type: rt }),
      ...(verification && { verification_status: verification }),
      ...(category && { tier2_categories: category }),
      ...(complexity && { complexity_level: complexity }),
      ...(deploy && { deployment_type: deploy }),
      ...(search && { search }),
    }),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pt-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            {search ? `Search results for "${search}"` : category ? category : 'Explore'}
          </h1>
          <p className="text-[12px] text-[#555] mt-0.5">{data?.total || 0} resources</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block w-52"><SearchInput value={search} onChange={setSearch} /></div>
          <select value={sort} onChange={(e) => set('sort', e.target.value)}
            className="h-8 px-2.5 rounded-md bg-[#111] border border-[#1e1e1e] text-[12px] text-[#999] focus:outline-none focus:border-[#7c3aed]/40">
            {SORTS.map(s => <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Resource type tabs */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
        {RESOURCE_TYPES.map(r => (
          <button key={r.value} onClick={() => set('resource_type', r.value)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
              rt === r.value ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a]' : 'text-[#666] hover:text-[#999] border border-transparent'
            }`}>
            <span>{r.icon}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>
      {rt && RESOURCE_TYPES.find(r => r.value === rt)?.desc && (
        <p className="text-[11px] text-[#555] mb-5">{RESOURCE_TYPES.find(r => r.value === rt)?.desc}</p>
      )}

      {/* Mobile filter toggle */}
      {openMobile && (
        <FilterPanel mobile onClose={() => setOpenMobile(false)}
          rt={rt} verification={verification} category={category} complexity={complexity} deploy={deploy} set={set} clear={clear} />
      )}

      <div className="flex gap-8">
        {/* Desktop filters */}
        {openDesktop && (
          <FilterPanel
            rt={rt} verification={verification} category={category} complexity={complexity} deploy={deploy}
            set={set} clear={clear} onClose={() => setOpenDesktop(false)} />
        )}
        {!openDesktop && (
          <button onClick={() => setOpenDesktop(true)} className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[#222] text-[#666] text-[12px] hover:text-white hover:border-[#333] transition-all">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[#1a1a1a] p-4 animate-pulse">
                  <div className="flex items-center gap-2.5 mb-3"><div className="w-8 h-8 rounded-lg bg-[#151515]" /><div className="h-3 w-24 rounded bg-[#151515]" /></div>
                  <div className="h-2 w-full rounded bg-[#151515] mb-2" /><div className="h-2 w-3/4 rounded bg-[#151515]" />
                </div>
              ))}
            </div>
          ) : data?.data ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const items = data.data as any[];
                  const featured = items.filter((a: any) => a.is_featured === 1);
                  const normal = items.filter((a: any) => a.is_featured !== 1);

                  // Build a CTA card for "Get Featured"
                  const ctaCard = (
                    <Link to="/featured" key="cta">
                      <div className="group block h-full rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent hover:border-amber-500/35 transition-all duration-300 p-5 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                          <span className="text-lg">★</span>
                        </div>
                        <h3 className="text-[13px] font-semibold text-amber-300 mb-1">Get Featured</h3>
                        <p className="text-[11px] text-[#666] leading-relaxed">Want your project highlighted with a gold badge? Stand out from the crowd.</p>
                      </div>
                    </Link>
                  );

                  const result: any[] = [];
                  let fi = 0, ni = 0, ctaPlaced = false;
                  const totalSlots = Math.min(items.length, 20);
                  const ctaSlot = Math.floor(totalSlots / 2);

                  for (let i = 0; i < totalSlots; i++) {
                    if (i === ctaSlot && !ctaPlaced) {
                      result.push({ _cta: true });
                      ctaPlaced = true;
                    }
                    if (fi < featured.length && i > 0 && i % 5 === 0) {
                      result.push({ ...featured[fi], _featuredCard: true });
                      fi++;
                    } else if (ni < normal.length) {
                      result.push({ ...normal[ni], _featuredCard: false });
                      ni++;
                    }
                  }

                  // Add CTA if not placed
                  if (!ctaPlaced) result.push({ _cta: true });

                  // Spill remaining
                  while (fi < featured.length) { result.push({ ...featured[fi], _featuredCard: true }); fi++; }
                  while (ni < normal.length) { result.push({ ...normal[ni], _featuredCard: false }); ni++; }

                  return result.map((a: any) => {
                    if (a._cta) return ctaCard;
                    return <AgentCard key={a.id} agent={a} featured={a._featuredCard} />;
                  });
                })()}
              </div>
              {data.total > 24 && <div className="flex justify-center mt-10"><Pagination total={data.total} page={data.page} limit={data.limit} /></div>}
            </>
          ) : (
            <div className="py-20 text-center"><p className="text-[#555] text-sm">No results found</p>
              <button onClick={clear} className="text-[#7c3aed] mt-2 text-[13px] hover:text-[#a78bfa]">Clear filters</button></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Filter Panel ── */
function FilterPanel({ mobile, onClose, rt, verification, category, complexity, deploy, set, clear }: {
  mobile?: boolean; onClose?: () => void;
  rt: string; verification: string; category: string; complexity: string; deploy: string;
  set: (k: string, v: string) => void; clear: () => void;
}) {
  const active = [rt, verification, category, complexity, deploy].filter(Boolean).length;

  return (
    <div className={mobile ? 'fixed inset-0 z-50 sm:hidden' : 'hidden sm:block w-56 flex-shrink-0'}>
      {mobile && <div className="absolute inset-0 bg-black/60" onClick={onClose} />}
      <div className={mobile ? 'absolute right-0 top-0 bottom-0 w-72 bg-[#0a0a0a] border-l border-[#1a1a1a] p-4 overflow-y-auto' : 'sticky top-20'}>
        {!mobile && active > 0 && (
          <button onClick={clear} className="text-[11px] text-[#666] hover:text-white mb-4 block">Clear all</button>
        )}
        <Section label="Use Case">
          {TIER2_CATS.map(c => (
            <RBtn key={c.value} label={`${c.icon} ${c.label}`} checked={category === c.value.split(' ')[0]} 
              onClick={() => set('category_slug', category === c.value.split(' ')[0] ? '' : c.value.split(' ')[0])} />
          ))}
        </Section>

        {complexity && <Section label="Complexity">
          {COMPLEXITY.map(c => (
            <RBtn key={c} label={c} checked={complexity === c} onClick={() => set('complexity_level', complexity === c ? '' : c)} />
          ))}
        </Section>}

        {deploy && <Section label="Deployment">
          {DEPLOYMENT.map(d => (
            <RBtn key={d} label={d} checked={deploy === d} onClick={() => set('deployment_type', deploy === d ? '' : d)} />
          ))}
        </Section>}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-5">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-[#555] mb-1.5 block">{label}</label>
    <div className="space-y-0.5">{children}</div>
  </div>;
}

function RBtn({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button onClick={onClick}
    className={`w-full text-left text-[12px] px-2 py-1.5 rounded-md transition-colors ${checked ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#999]'}`}>
    {label}
  </button>;
}

function Pagination({ total, page, limit }: { total: number; page: number; limit: number }) {
  const [sp, setSp] = useSearchParams();
  const totalPages = Math.ceil(total / limit);
  const go = (p: number) => { sp.set('page', String(p)); setSp({ ...Object.fromEntries(sp) }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  return (
    <div className="flex items-center gap-1">
      {page > 1 && <button onClick={() => go(page - 1)} className="px-3 py-1.5 text-xs border border-[#1a1a1a] text-[#666] rounded-md hover:bg-[#111] hover:text-white transition-colors">Prev</button>}
      {pages.map((p, i) => typeof p === 'string' ? (
        <span key={`e${i}`} className="px-2 text-[#444]">...</span>
      ) : (
        <button key={p} onClick={() => go(p)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${p === page ? 'bg-white/[0.08] text-white' : 'border border-[#1a1a1a] text-[#666] hover:bg-[#111] hover:text-white'}`}>{p}</button>
      ))}
      {page < totalPages && <button onClick={() => go(page + 1)} className="px-3 py-1.5 text-xs border border-[#1a1a1a] text-[#666] rounded-md hover:bg-[#111] hover:text-white transition-colors">Next</button>}
    </div>
  );
}
