import type { CsmConfig } from '../config.js';
import { defaultAgentsRoot, expandHome } from '../paths.js';
import type { AgentsLinkStatus } from '../types.js';
import type { PlatformDefinition, PlatformId, PlatformSummary, PlatformsConfig } from './types.js';

const PLATFORM_IDS: PlatformId[] = ['cursor', 'agents', 'opencode', 'claude', 'codex'];

export const DEFAULT_ENABLED_PLATFORMS: PlatformId[] = ['cursor', 'agents', 'opencode'];

function builtinDefinition(id: PlatformId, personalRoot: string): PlatformDefinition {
  switch (id) {
    case 'cursor':
      return {
        id,
        label: 'Cursor',
        globalRoot: personalRoot,
        role: 'canonical',
        syncMode: 'none',
        enabled: true,
      };
    case 'agents':
      return {
        id,
        label: 'Open Agent Skills (npx skills)',
        globalRoot: expandHome(defaultAgentsRoot()),
        role: 'target',
        syncMode: 'symlink',
        enabled: true,
        publishFrom: 'canonical',
      };
    case 'opencode':
      return {
        id,
        label: 'OpenCode',
        globalRoot: expandHome('~/.config/opencode/skills'),
        role: 'target',
        syncMode: 'symlink',
        enabled: true,
        publishFrom: 'canonical',
        alternateRoots: [expandHome('~/.config/opencode/skill')],
      };
    case 'claude':
      return {
        id,
        label: 'Claude Code',
        globalRoot: expandHome('~/.claude/skills'),
        role: 'target',
        syncMode: 'symlink',
        enabled: false,
        publishFrom: 'canonical',
      };
    case 'codex':
      return {
        id,
        label: 'Codex',
        globalRoot: expandHome('~/.codex/skills'),
        role: 'target',
        syncMode: 'symlink',
        enabled: false,
        publishFrom: 'canonical',
      };
  }
}

export function defaultPlatformsConfig(_personalRoot?: string): PlatformsConfig {
  return {
    enabled: [...DEFAULT_ENABLED_PLATFORMS],
    definitions: Object.fromEntries(
      PLATFORM_IDS.map((id) => [id, { enabled: DEFAULT_ENABLED_PLATFORMS.includes(id) }]),
    ) as PlatformsConfig['definitions'],
  };
}

function mergePlatformDefinition(
  base: PlatformDefinition,
  patch?: Partial<Omit<PlatformDefinition, 'id'>>,
  enabledList?: PlatformId[],
): PlatformDefinition {
  const enabled =
    patch?.enabled ??
    (enabledList ? enabledList.includes(base.id) : base.enabled);
  return {
    ...base,
    ...patch,
    id: base.id,
    enabled,
    globalRoot: expandHome(patch?.globalRoot ?? base.globalRoot),
    alternateRoots: patch?.alternateRoots?.map(expandHome) ?? base.alternateRoots,
  };
}

/** Resolve effective platform list from config (v1/v2). */
export function resolvePlatforms(config: CsmConfig): PlatformDefinition[] {
  const personalRoot = config.paths.personalRoot;
  const platformsCfg = config.platforms ?? migratePlatformsFromV1(config);
  const enabledList = platformsCfg.enabled ?? DEFAULT_ENABLED_PLATFORMS;

  return PLATFORM_IDS.map((id) => {
    const base = builtinDefinition(id, personalRoot);
    if (id === 'cursor') {
      base.globalRoot = personalRoot;
    }
    if (id === 'agents' && config.paths.agentsRoot) {
      base.globalRoot = expandHome(config.paths.agentsRoot);
    }
    return mergePlatformDefinition(base, platformsCfg.definitions?.[id], enabledList);
  });
}

export function migratePlatformsFromV1(config: CsmConfig): PlatformsConfig {
  const enabled: PlatformId[] = [...DEFAULT_ENABLED_PLATFORMS];
  const definitions: PlatformsConfig['definitions'] = {};
  if (config.paths.agentsRoot === undefined) {
    definitions.agents = { enabled: false };
    const idx = enabled.indexOf('agents');
    if (idx >= 0) enabled.splice(idx, 1);
  }
  return { enabled, definitions };
}

export function resolvePlatformSummaries(config: CsmConfig): PlatformSummary[] {
  return resolvePlatforms(config);
}

export function getPlatformById(
  config: CsmConfig,
  platformId: string,
): PlatformDefinition | undefined {
  return resolvePlatforms(config).find((p) => p.id === platformId);
}

/** Keep legacy agentsLink field from bindings. */
export function agentsLinkFromBindings(
  bindings: { platformId: PlatformId; exists: boolean; ok: boolean; target: string | null }[],
): AgentsLinkStatus | undefined {
  const agents = bindings.find((b) => b.platformId === 'agents');
  if (!agents) return undefined;
  return {
    exists: agents.exists,
    ok: agents.ok,
    target: agents.target,
  };
}

export { PLATFORM_IDS };
