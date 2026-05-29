export type PlatformId = 'cursor' | 'agents' | 'opencode' | 'claude' | 'codex';

export type PlatformSyncMode = 'none' | 'symlink' | 'mirror';

export type PlatformRole = 'canonical' | 'target';

export type BindingIssue = 'missing' | 'wrong_target' | 'not_symlink';

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  globalRoot: string;
  role: PlatformRole;
  syncMode: PlatformSyncMode;
  enabled: boolean;
  publishFrom?: 'canonical';
  alternateRoots?: string[];
}

export interface PlatformBindingStatus {
  platformId: PlatformId;
  mode: PlatformSyncMode;
  expectedPath: string;
  exists: boolean;
  ok: boolean;
  target: string | null;
  issue?: BindingIssue;
}

export interface PlatformsConfig {
  enabled: PlatformId[];
  definitions: Partial<Record<PlatformId, Partial<Omit<PlatformDefinition, 'id'>>>>;
}

export type PlatformSummary = PlatformDefinition & {
  cliInstalled?: boolean;
};
