export interface Agent {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  type: string;
  description: string;
  long_description: string | null;
  author_github: string;
  repository_url: string;
  homepage_url: string | null;
  license: string | null;
  hermes_version_required: string | null;
  tier1_category: string | null;
  tier1_subcategory: string | null;
  tier2_categories: string[];
  use_cases: string[];
  complexity_level: string | null;
  deployment_type: string | null;
  required_skills: string[];
  external_dependencies: string[];
  maintenance_status: string;
  compatible_resources: string[];
  tags: string[];
  tools_used: string[];
  verification_status: string;
  verification_score: number;
  verification_checks: Record<string, boolean>;
  verified_at: string | null;
  security_scan: any[];
  security_verdict: string;
  trust_level: string;
  stars: number;
  forks: number;
  watchers: number;
  last_commit_date: string | null;
  created_at: string;
  updated_at: string;
  last_crawled: string | null;
  icon_url: string | null;
  banner_url: string | null;
  is_featured: boolean;
  is_archived: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  icon: string | null;
  count: number;
}

export interface EcosystemStats {
  total_agents: number;
  verified_agents: number;
  avg_verification_score: number;
  new_agents_this_month: number;
  most_used_tools: Record<string, number>;
  top_contributors: any[];
}
