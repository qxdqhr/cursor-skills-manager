export type SkillSource = 'personal' | 'project';

export type PlatformId = 'cursor' | 'agents' | 'opencode' | 'claude' | 'codex';

export type BindingIssue = 'missing' | 'wrong_target' | 'not_symlink';

export interface PlatformBindingStatus {
  platformId: PlatformId;
  mode: 'none' | 'symlink' | 'mirror';
  expectedPath: string;
  exists: boolean;
  ok: boolean;
  target: string | null;
  issue?: BindingIssue;
}

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  globalRoot: string;
  role: 'canonical' | 'target';
  syncMode: 'none' | 'symlink' | 'mirror';
  enabled: boolean;
  publishFrom?: 'canonical';
  alternateRoots?: string[];
  cliInstalled?: boolean;
  cliPath?: string;
}

export interface PlatformsConfig {
  enabled: PlatformId[];
  definitions: Partial<Record<PlatformId, Partial<Omit<PlatformDefinition, 'id'>>>>;
}

export type { SkillTreeNode, SkillsTree } from './lib/categories.js';
export { UNCATEGORIZED_CATEGORY_ID, matchesCategoryPath, normalizeSkillsTree } from './lib/categories.js';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface SkillSummary {
  skillId: string;
  source: SkillSource;
  readOnly: boolean;
  name: string;
  description: string;
  categoryPath: string;
  relativePath: string;
  rootPath: string;
  skillMdPath: string;
  hasScripts: boolean;
  mtimeMs: number;
  validation: { ok: boolean; errors: ValidationError[] };
  git?: { dirty?: boolean };
  /** @deprecated use bindings for agents platform */
  agentsLink?: { exists: boolean; ok: boolean; target: string | null };
  bindings?: PlatformBindingStatus[];
  platforms?: PlatformId[];
}

export interface PublicConfig {
  version: number;
  locale: string;
  theme?: string;
  api: { port: number; hasToken: boolean };
  paths: {
    personalRoot: string;
    agentsRoot?: string;
    projectScanGlobs?: string[];
    editor?: string;
  };
  platforms?: PlatformsConfig;
}

export interface ApiErrorBody {
  ok: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface ApiOkBody<T> {
  ok: true;
  data: T;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  paths?: string | string[];
  'disable-model-invocation'?: boolean;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SkillDetail extends SkillSummary {
  frontmatter: SkillFrontmatter;
  bodyMarkdown: string;
}

export interface SkillFileEntry {
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface ValidateResult {
  ok: boolean;
  errors: ValidationError[];
}
