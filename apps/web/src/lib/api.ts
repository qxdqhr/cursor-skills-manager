import { getStoredToken } from './token.js';
import type {
  ApiErrorBody,
  ApiOkBody,
  PlatformDefinition,
  PlatformId,
  PlatformsConfig,
  PublicConfig,
  SkillDetail,
  SkillFileEntry,
  SkillFrontmatter,
  SkillLogicalMeta,
  SkillSummary,
  SkillsTree,
  ValidateResult,
} from '../types.js';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: Record<string, unknown>,
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
    throw new ApiClientError(
      json.error.message,
      json.error.code,
      res.status,
      json.error.details,
    );
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

export async function patchConfig(patch: {
  locale?: 'zh' | 'en';
  theme?: 'light' | 'dark' | 'system';
  platforms?: PlatformsConfig;
}): Promise<PublicConfig> {
  return request<PublicConfig>('/config', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function fetchSkills(params: {
  q?: string;
  source?: string;
  gitDirty?: boolean;
  platform?: PlatformId;
  bindingIssue?: boolean;
  favorite?: boolean;
  tag?: string;
}): Promise<{ items: SkillSummary[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.source) sp.set('source', params.source);
  if (params.gitDirty) sp.set('gitDirty', 'true');
  if (params.platform) sp.set('platform', params.platform);
  if (params.bindingIssue) sp.set('bindingIssue', 'true');
  if (params.favorite) sp.set('favorite', 'true');
  if (params.tag) sp.set('tag', params.tag);
  const qs = sp.toString();
  return request(`/skills${qs ? `?${qs}` : ''}`);
}

export async function fetchPlatforms(): Promise<{ items: PlatformDefinition[] }> {
  return request<{ items: PlatformDefinition[] }>('/platforms');
}

export async function fetchSkillsTree(): Promise<SkillsTree> {
  return request<SkillsTree>('/skills/tree');
}

export async function postIndexRebuild(): Promise<{ count: number; durationMs: number }> {
  return request('/index/rebuild', { method: 'POST' });
}

export type IndexHealthStatus = {
  healthy: boolean;
  needsRebuild: boolean;
  schemaVersion: string | null;
  builtAt: number | null;
  indexCount: number;
  scanCount: number;
  drift: number;
};

export async function fetchIndexStatus(): Promise<IndexHealthStatus> {
  return request<IndexHealthStatus>('/index/status');
}

export async function patchSkillMeta(
  skillId: string,
  patch: Partial<Omit<SkillLogicalMeta, 'skillId'>>,
): Promise<SkillLogicalMeta> {
  return request(`/skills/${encodeURIComponent(skillId)}/meta`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function postSkillRename(skillId: string, newName: string): Promise<SkillDetail> {
  return request(`/skills/${encodeURIComponent(skillId)}/rename`, {
    method: 'POST',
    body: JSON.stringify({ newName }),
  });
}

export async function postSkillMove(skillId: string, categoryPath: string): Promise<SkillDetail> {
  return request(`/skills/${encodeURIComponent(skillId)}/move`, {
    method: 'POST',
    body: JSON.stringify({ categoryPath }),
  });
}

export async function postCopyToPersonal(body: {
  sourceSkillId: string;
  categoryPath?: string;
  name?: string;
}): Promise<SkillDetail> {
  return request('/skills/copy-to-personal', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchExportInventory(params: {
  format?: 'md' | 'json';
  write?: boolean;
}): Promise<{ format: string; content: string; path?: string }> {
  const sp = new URLSearchParams();
  if (params.format) sp.set('format', params.format);
  if (params.write) sp.set('write', 'true');
  const qs = sp.toString();
  return request(`/export/inventory${qs ? `?${qs}` : ''}`);
}

export async function postSkillsAdd(args: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return request('/integrations/skills-add', {
    method: 'POST',
    body: JSON.stringify({ args }),
  });
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

export type GitStatus = {
  branch: string;
  clean: boolean;
  files: { path: string; status: string }[];
};

export type GitLogEntry = {
  hash: string;
  date: string;
  message: string;
  author: string;
};

export async function fetchGitStatus(): Promise<GitStatus> {
  return request<GitStatus>('/git/status');
}

export async function fetchGitDiff(path?: string): Promise<{ path: string | null; diff: string }> {
  const qs = path ? `?path=${encodeURIComponent(path)}` : '';
  return request(`/git/diff${qs}`);
}

export async function postGitCommit(body: {
  message: string;
  paths?: string[];
}): Promise<{ hash: string; summary: { changes: number; insertions: number; deletions: number } }> {
  return request('/git/commit', { method: 'POST', body: JSON.stringify(body) });
}

export async function fetchGitLog(params?: {
  path?: string;
  limit?: number;
}): Promise<{ items: GitLogEntry[] }> {
  const sp = new URLSearchParams();
  if (params?.path) sp.set('path', params.path);
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return request(`/git/log${qs ? `?${qs}` : ''}`);
}

export async function postSyncAgents(): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return request('/integrations/sync-agents', { method: 'POST' });
}

export type PublishBatchResult = {
  platformId: PlatformId;
  dryRun: boolean;
  items: {
    skillId: string;
    name: string;
    action: string;
    linkPath: string;
    target: string;
    issue?: string;
    message?: string;
  }[];
  summary: {
    created: number;
    skipped: number;
    repaired: number;
    conflicts: number;
    unpublished: number;
  };
};

export async function postPlatformPublish(
  platformId: PlatformId,
  body: {
    skillIds?: string[];
    all?: boolean;
    dryRun?: boolean;
    force?: boolean;
  },
): Promise<PublishBatchResult> {
  return request(`/platforms/${platformId}/publish`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postPlatformRepair(
  platformId: PlatformId,
  body: {
    skillIds?: string[];
    all?: boolean;
    dryRun?: boolean;
    force?: boolean;
  },
): Promise<PublishBatchResult> {
  return request(`/platforms/${platformId}/repair`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postSyncPlatforms(body: {
  platformIds?: PlatformId[];
  skillIds?: string[];
  all?: boolean;
  dryRun?: boolean;
  force?: boolean;
}): Promise<{ platforms: PublishBatchResult[] }> {
  return request('/integrations/sync-platforms', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchAgentsLinks(): Promise<{
  items: { name: string; skillId: string; agentsLink: { exists: boolean; ok: boolean; target: string | null } }[];
}> {
  return request('/integrations/agents-links');
}

export async function postOpenTarget(body: {
  skillId: string;
  target: 'folder' | 'editor' | 'terminal';
}): Promise<{ opened: string }> {
  return request('/open', { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteSkill(
  skillId: string,
  mode: 'soft' | 'hard' = 'hard',
): Promise<{ deleted: true; skillId: string }> {
  return request(`/skills/${encodeURIComponent(skillId)}?mode=${mode}`, {
    method: 'DELETE',
  });
}
