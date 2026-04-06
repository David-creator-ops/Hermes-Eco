// Shared types for Hermes Agent Registry

export interface Agent {
  id: number;
  name: string;
  slug: string;
  type: 'agent' | 'tool' | 'skill';
  description: string;
  long_description?: string;
  author_github: string;
  repository_url: string;
  homepage_url?: string;
  license?: string;
  hermes_version_required?: string;
  tags: string[];
  tools_used: string[];
  verification_status: 'verified' | 'unverified' | 'rejected';
  verification_score: number;
  verification_checks: Record<string, boolean>;
  verified_at?: string;
  stars: number;
  forks: number;
  watchers: number;
  last_commit_date?: string;
  created_at: string;
  updated_at: string;
  last_crawled?: string;
  icon_url?: string;
  banner_url?: string;
  is_featured: boolean;
  is_archived: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface EcosystemStats {
  total_agents: number;
  verified_agents: number;
  avg_verification_score: number;
  new_agents_this_month: number;
  most_used_tools: Record<string, number>;
}

export interface AgentFilters {
  type?: string;
  verification_status?: string;
  tools_used?: string;
  tags?: string;
  sort?: 'recent' | 'popular' | 'verified';
  page?: number;
  limit?: number;
}
