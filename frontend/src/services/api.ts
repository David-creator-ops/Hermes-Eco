import type { Agent, Category, EcosystemStats } from '../types';

export interface AgentsResponse {
  data: Agent[];
  total: number;
  page: number;
  limit: number;
}

export interface AgentResponse {
  data: Agent;
}

export interface CategoriesResponse {
  data: Category[];
}

export interface StatsResponse {
  data: EcosystemStats & {
    resource_types?: { resource_type: string; count: number }[];
    use_cases?: { name: string; slug: string; icon: string; count: number }[];
    complexity_levels?: { complexity_level: string; count: number }[];
    deployment_types?: { deployment_type: string; count: number }[];
  };
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  listAgents: async (params: Record<string, string> = {}): Promise<AgentsResponse> => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi<AgentsResponse>(`/api/agents?${qs}`);
  },

  getAgentBySlug: async (slug: string): Promise<AgentResponse> => {
    return fetchApi<AgentResponse>(`/api/agents/slug/${slug}`);
  },

  getAgentById: async (id: number): Promise<AgentResponse> => {
    return fetchApi<AgentResponse>(`/api/agents/id/${id}`);
  },

  getFeatured: async (): Promise<AgentsResponse> => {
    return fetchApi<AgentsResponse>('/api/agents/featured');
  },

  getRecent: async (): Promise<AgentsResponse> => {
    return fetchApi<AgentsResponse>('/api/agents/recent');
  },

  getCategories: async (): Promise<CategoriesResponse> => {
    return fetchApi<CategoriesResponse>('/api/categories');
  },

  getStats: async (): Promise<StatsResponse> => {
    return fetchApi<StatsResponse>('/api/stats');
  },
};
