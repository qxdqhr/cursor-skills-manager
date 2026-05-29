import {
  type CsmConfig,
  type PlatformBindingStatus,
  type PlatformId,
  type SkillSummary,
  getPlatformById,
  publishSkillBatch,
  repairSkillBatch,
  syncPlatformsBatch,
  resolvePlatformSummaries,
  enrichPersonalSkillsWithBindings,
} from '@csm/core';
import { ApiError } from '../errors.js';
import { loadAllSkills } from './skills.js';

const PLATFORM_IDS = new Set<string>(['cursor', 'agents', 'opencode', 'claude', 'codex']);

export type PlatformMutationBody = {
  skillIds?: string[];
  all?: boolean;
  dryRun?: boolean;
  force?: boolean;
};

export type SyncPlatformsBody = PlatformMutationBody & {
  platformIds?: PlatformId[];
};

function assertPlatformId(platformId: string): PlatformId {
  if (!PLATFORM_IDS.has(platformId)) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }
  return platformId as PlatformId;
}

function selectPersonalSkills(
  personal: SkillSummary[],
  body: PlatformMutationBody,
): SkillSummary[] {
  if (body.all) return personal;
  if (body.skillIds?.length) {
    const set = new Set(body.skillIds);
    const selected = personal.filter((s) => set.has(s.skillId));
    if (selected.length === 0) {
      throw new ApiError('NOT_FOUND', 'No matching personal skills');
    }
    return selected;
  }
  throw new ApiError('VALIDATION_ERROR', 'Provide skillIds or all: true');
}

async function refreshBindings(config: CsmConfig, skills: SkillSummary[]): Promise<void> {
  await enrichPersonalSkillsWithBindings(config, skills);
}

export function listPlatforms(config: CsmConfig) {
  return { items: resolvePlatformSummaries(config) };
}

export async function listPlatformBindings(config: CsmConfig, platformId: string) {
  const id = assertPlatformId(platformId);
  const platform = getPlatformById(config, id);
  if (!platform) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }

  const { personal } = await loadAllSkills(config);
  const items = personal.map((skill) => {
    const binding =
      skill.bindings?.find((b) => b.platformId === id) ??
      ({
        platformId: id,
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

  return { platformId: id, platform, items };
}

export async function publishPlatformSkills(
  config: CsmConfig,
  platformId: string,
  body: PlatformMutationBody,
) {
  const id = assertPlatformId(platformId);
  const platform = getPlatformById(config, id);
  if (!platform) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }
  if (platform.role === 'canonical' || platform.syncMode === 'none') {
    throw new ApiError('VALIDATION_ERROR', `Platform ${id} does not support publish`);
  }

  const { personal } = await loadAllSkills(config);
  const skills = selectPersonalSkills(personal, body);
  const result = await publishSkillBatch(config, id, skills, {
    dryRun: body.dryRun,
    force: body.force,
  });

  if (!body.dryRun) {
    await refreshBindings(config, personal);
  }

  return result;
}

export async function repairPlatformSkills(
  config: CsmConfig,
  platformId: string,
  body: PlatformMutationBody,
) {
  const id = assertPlatformId(platformId);
  const platform = getPlatformById(config, id);
  if (!platform) {
    throw new ApiError('NOT_FOUND', `Unknown platform: ${platformId}`);
  }

  const { personal } = await loadAllSkills(config);
  const skills = selectPersonalSkills(personal, body);
  const result = await repairSkillBatch(config, id, skills, {
    dryRun: body.dryRun,
    force: body.force,
  });

  if (!body.dryRun) {
    await refreshBindings(config, personal);
  }

  return result;
}

export async function syncPlatforms(config: CsmConfig, body: SyncPlatformsBody) {
  const { personal } = await loadAllSkills(config);
  const skills = selectPersonalSkills(personal, body);
  const result = await syncPlatformsBatch(config, skills, {
    platformIds: body.platformIds,
    dryRun: body.dryRun,
    force: body.force,
  });

  if (!body.dryRun) {
    await refreshBindings(config, personal);
  }

  return result;
}
