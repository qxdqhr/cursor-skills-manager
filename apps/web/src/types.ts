export type SkillSource = 'personal' | 'project';

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

export interface SkillTreeNode {
  id: string;
  label: string;
  skillCount: number;
  children: SkillTreeNode[];
}

export interface SkillsTree {
  personal: SkillTreeNode[];
  project: {
    workspaceId: string;
    workspacePath: string;
    categories: SkillTreeNode[];
  }[];
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
