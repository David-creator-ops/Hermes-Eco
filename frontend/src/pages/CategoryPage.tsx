import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { AgentCard } from '../components/agent/AgentCard';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.getCategory(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 animate-pulse"><div className="h-4 w-16 bg-white/[0.04] rounded mb-8" /><div className="h-6 w-48 bg-white/[0.04] rounded mb-2" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-white/[0.04] rounded-lg" />)}</div></div>;
  if (!data?.data) return <div className="max-w-6xl mx-auto px-4 py-20 text-[#555] text-sm"><Link to="/browse" className="text-white">← Browse</Link><p className="mt-6 text-white">Category not found</p></div>;

  const c = data.data as any;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/browse" className="text-[12px] text-[#555] hover:text-white flex items-center gap-1 mb-8 transition-colors">← All agents</Link>
      <p className="text-[8px] text-[#333] uppercase tracking-widest mb-1">{c.icon}</p>
      <h1 className="text-xl font-semibold text-white tracking-tight mb-1">{c.name}</h1>
      {c.description && <p className="text-[13px] text-[#666] mb-8 max-w-lg">{c.description}</p>}
      {data.total !== undefined && <p className="text-[11px] text-[#444] mb-6">{data.total} agent{data.total !== 1 ? 's' : ''}</p>}
      {c.agents?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.agents.map((a: any) => <AgentCard key={a.id} agent={a} featured={a.is_featured === 1} />)}
        </div>
      ) : (
        <div className="py-16 text-center text-[#444] text-sm">No agents in this category yet</div>
      )}
    </div>
  );
}
