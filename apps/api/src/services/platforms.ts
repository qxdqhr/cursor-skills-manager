import {
  type CsmConfig,
  type PlatformBindingStatus,
  type PlatformId,
  getPlatformById,
  resolvePlatformSummaries,
} from '@csm/core';
import { ApiError } from '../errors.js';
import { loadAllSkills } from './skills.js';

const PLATFORM_IDS = new Set<string>(['cursor', 'agents', 'opencode', 'claude', 'codex']);

export function listPlatforms(config: CsmConfig) {
  return { items: resolvePlatformSummaries(config) };
}

export async function listPlatformBindings(config: CsmConfig, platformId: string) {
  if (!PLATFORM_IDS.has(platformId)) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }
  const platform = getPlatformById(config, platformId);
  if (!platform) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }

  const { personal } = await loadAllSkills(config);
  const items = personal.map((skill) => {
    const binding =
      skill.bindings?.find((b) => b.platformId === platformId) ??
      ({
        platformId: platformId as PlatformId,
        mode: platform.syncMode,
        expectedPath: '',
        exists: false,
        ok: false,
        target: null,
        issue: 'missing',
      } satisfies PlatformBindingStatus);
    return {
      skillId: skill.skillId,
      name: skill.name,
      binding,
    };
  });

  return { platformId, platform, items };
}
