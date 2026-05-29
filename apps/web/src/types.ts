export type SkillSource = 'personal' | 'project';

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
  agentsLink?: { exists: boolean; ok: boolean; target: string | null };
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
