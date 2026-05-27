import { getStoredToken } from './token.js';
import type { ApiErrorBody, ApiOkBody, PublicConfig, SkillSummary, SkillsTree } from '../types.js';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (init?.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const json = (await res.json()) as ApiOkBody<T> | ApiErrorBody;

  if (!json.ok) {
    throw new ApiClientError(json.error.message, json.error.code, res.status);
  }
  return json.data;
}

export type HealthData = {
  status: string;
  version: string;
  personalRoot: string;
  personalRootExists: boolean;
  isGitRepo: boolean;
  hasToken: boolean;
  indexOk: boolean;
};

export async function fetchHealth(): Promise<HealthData> {
  const res = await fetch(`${BASE}/health`);
  const json = (await res.json()) as ApiOkBody<HealthData> | ApiErrorBody;
  if (!json.ok) {
    throw new ApiClientError(json.error.message, json.error.code, res.status);
  }
  return json.data;
}

export async function fetchConfig(): Promise<PublicConfig> {
  return request<PublicConfig>('/config');
}

export async function fetchSkills(params: {
  q?: string;
  source?: string;
}): Promise<{ items: SkillSummary[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.source) sp.set('source', params.source);
  const qs = sp.toString();
  return request(`/skills${qs ? `?${qs}` : ''}`);
}

export async function fetchSkillsTree(): Promise<SkillsTree> {
  return request<SkillsTree>('/skills/tree');
}

export async function postIndexRebuild(): Promise<{ count: number; durationMs: number }> {
  return request('/index/rebuild', { method: 'POST' });
}
