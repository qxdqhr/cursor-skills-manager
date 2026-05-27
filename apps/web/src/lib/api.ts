import { getStoredToken } from './token.js';
import type {
  ApiErrorBody,
  ApiOkBody,
  PublicConfig,
  SkillDetail,
  SkillFileEntry,
  SkillFrontmatter,
  SkillSummary,
  SkillsTree,
  ValidateResult,
} from '../types.js';

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

export async function fetchSkillDetail(skillId: string): Promise<SkillDetail> {
  return request<SkillDetail>(`/skills/${encodeURIComponent(skillId)}`);
}

export async function fetchSkillFiles(skillId: string): Promise<{ files: SkillFileEntry[] }> {
  return request(`/skills/${encodeURIComponent(skillId)}/files`);
}

export async function validateSkillDraft(body: {
  skillId?: string;
  frontmatter: Partial<SkillFrontmatter>;
  bodyMarkdown?: string;
}): Promise<ValidateResult> {
  return request('/skills/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function putSkill(
  skillId: string,
  body: { frontmatter: Partial<SkillFrontmatter>; bodyMarkdown: string },
): Promise<SkillDetail> {
  return request(`/skills/${encodeURIComponent(skillId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function postSkill(body: {
  name: string;
  categoryPath?: string;
  template?: 'blank';
  copyFromSkillId?: string | null;
}): Promise<SkillDetail> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/skills`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiOkBody<SkillDetail> | ApiErrorBody;
  if (!json.ok) {
    throw new ApiClientError(json.error.message, json.error.code, res.status);
  }
  return json.data;
}

export async function deleteSkill(
  skillId: string,
  mode: 'soft' | 'hard' = 'hard',
): Promise<{ deleted: true; skillId: string }> {
  return request(`/skills/${encodeURIComponent(skillId)}?mode=${mode}`, {
    method: 'DELETE',
  });
}
