export type SkillSource = 'personal' | 'project';

export type ValidationErrorCode =
  | 'NAME_REQUIRED'
  | 'NAME_INVALID'
  | 'NAME_DIR_MISMATCH'
  | 'DESCRIPTION_REQUIRED'
  | 'DESCRIPTION_TOO_LONG'
  | 'PARSE_ERROR';

export interface ValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  paths?: string | string[];
  'disable-model-invocation'?: boolean;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AgentsLinkStatus {
  exists: boolean;
  ok: boolean;
  target: string | null;
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
  agentsLink?: AgentsLinkStatus;
  git?: { dirty: boolean };
}

export interface SkillDetail extends SkillSummary {
  frontmatter: SkillFrontmatter;
  bodyMarkdown: string;
}

export interface ProjectWorkspace {
  workspaceId: string;
  workspacePath: string;
  skillsRoot: string;
}

export interface ValidateSkillInput {
  directoryName: string;
  frontmatter: Partial<SkillFrontmatter>;
  bodyMarkdown?: string;
}
