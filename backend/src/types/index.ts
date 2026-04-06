export interface Agent {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string;
  long_description: string | null;
  author_github: string;
  repository_url: string;
  homepage_url: string | null;
  license: string | null;
  hermes_version_required: string | null;
  tags: string[];
  tools_used: string[];
  verification_status: string;
  verification_score: number;
  verification_checks: Record<string, boolean>;
  verified_at: string | null;
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
  description: string | null;
  icon: string | null;
}

export interface AuthorsListResponse {
  agents: Agent[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiSuccess<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const VALID_SORT = ['recent', 'popular', 'verified', 'stars'] as const;
export const VALID_TYPES = ['agent', 'tool', 'skill'] as const;
export const VALID_VERIFICATION = ['verified', 'unverified', 'rejected'] as const;
