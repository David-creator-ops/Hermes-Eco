import type { Agent } from '../types';
import { Link } from 'react-router-dom';
import { Star, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface AgentCardProps {
  agent: Agent;
  featured?: boolean;
}

export function AgentCard({ agent, featured = false }: AgentCardProps) {
  const isVerified = agent.verification_score >= 0.75;

  // Resource type badge config
  const resourceConfig: Record<string, { label: string; emoji: string; color: string }> = {
    agent: { label: 'Agent', emoji: '🤖', color: 'text-purple-400 bg-purple-400/[0.08]' },
    skill: { label: 'Skill', emoji: '🛠️', color: 'text-blue-400 bg-blue-400/[0.08]' },
    tool: { label: 'Tool', emoji: '🔧', color: 'text-emerald-400 bg-emerald-400/[0.08]' },
    integration: { label: 'Integration', emoji: '🔌', color: 'text-amber-400 bg-amber-400/[0.08]' },
    workflow: { label: 'Workflow', emoji: '⚙️', color: 'text-rose-400 bg-rose-400/[0.08]' },
    'memory-system': { label: 'Memory', emoji: '🧠', color: 'text-indigo-400 bg-indigo-400/[0.08]' },
    'model-config': { label: 'Model Config', emoji: '🎯', color: 'text-cyan-400 bg-cyan-400/[0.08]' },
    router: { label: 'Router', emoji: '🔄', color: 'text-orange-400 bg-orange-400/[0.08]' },
  };

  const rt = resourceConfig[agent.resource_type] || resourceConfig[agent.type] || resourceConfig.agent;

  return (
    <Link
      to={`/agents/${agent.slug}`}
      className={`group block rounded-xl transition-all duration-300 ${
        featured 
          ? 'border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.04] to-[#0d0d0d]/50 hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.06)]' 
          : 'border border-[#1a1a1a] hover:border-[#333] bg-[#0d0d0d]/50 hover:bg-[#0f0f0f]'
      }`}
    >
      {featured && (
        <div className="px-4 pt-3 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="text-[9px]">★</span> Featured
          </span>
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#151515] border border-[#222] flex items-center justify-center flex-shrink-0">
              {agent.icon_url ? (
                <img src={agent.icon_url} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
              ) : (
                <span className="text-xs font-bold text-[#888]">{agent.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-medium text-[#DDD] truncate group-hover:text-white transition-colors">
                {agent.name}
              </h3>
              <span className="text-[11px] text-[#555]">@{agent.author_github}</span>
            </div>
          </div>

          {agent.stars > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#777] flex-shrink-0">
              <Star className="w-3 h-3" />
              {agent.stars >= 1000 ? `${(agent.stars / 1000).toFixed(1)}k` : agent.stars}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[12px] text-[#666] leading-relaxed line-clamp-2 mb-3">
          {agent.description}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${rt.color}`}>
            {rt.label}
          </span>
          {isVerified ? (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-400/[0.08]">
              Verified
            </span>
          ) : agent.verification_score >= 0.5 ? (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-400 bg-amber-400/[0.08]">
              Community
            </span>
          ) : null}
          <span className="text-[10px] text-[#444] font-medium">{agent.complexity_level}</span>
        </div>

        {/* Tier 2 categories */}
        {agent.tier2_categories && agent.tier2_categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {agent.tier2_categories.slice(0, 3).map((c: string) => (
              <span key={c} className="text-[10px] text-[#555] bg-[#151515] px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {agent.tools_used.slice(0, 3).map((t: string) => (
              <span key={t} className="text-[10px] text-[#555]">{t}</span>
            ))}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#7c3aed] transition-all -translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
