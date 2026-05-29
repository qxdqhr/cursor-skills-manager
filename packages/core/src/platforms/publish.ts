import { lstat, mkdir, readlink, rm, symlink, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CsmConfig } from '../config.js';
import type { SkillSummary } from '../types.js';
import { checkPlatformBinding } from './checkBinding.js';
import { getPlatformById, resolvePlatforms } from './registry.js';
import type { BindingIssue, PlatformDefinition, PlatformId } from './types.js';

export type PublishAction =
  | 'created'
  | 'skipped'
  | 'repaired'
  | 'conflict'
  | 'unpublished'
  | 'dry_run';

export type PublishSkillResult = {
  skillId: string;
  name: string;
  action: PublishAction;
  linkPath: string;
  target: string;
  issue?: BindingIssue;
  message?: string;
};

export type PublishBatchOptions = {
  dryRun?: boolean;
  force?: boolean;
};

export type PublishBatchResult = {
  platformId: PlatformId;
  dryRun: boolean;
  items: PublishSkillResult[];
  summary: {
    created: number;
    skipped: number;
    repaired: number;
    conflicts: number;
    unpublished: number;
  };
};

function canonicalDir(personalRoot: string, relativePath: string): string {
  return resolve(join(personalRoot, relativePath));
}

function linkPathFor(platform: PlatformDefinition, skillName: string): string {
  return join(platform.globalRoot, skillName);
}

function assertPublishablePlatform(platform: PlatformDefinition): void {
  if (platform.role === 'canonical' || platform.syncMode === 'none') {
    throw new Error(`Platform ${platform.id} does not support publish`);
  }
  if (platform.syncMode !== 'symlink') {
    throw new Error(`Platform ${platform.id} syncMode ${platform.syncMode} not implemented`);
  }
}

async function pathIsEmptyDirectory(path: string): Promise<boolean> {
  const st = await lstat(path);
  if (!st.isDirectory()) return false;
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(path);
  return entries.length === 0;
}

async function removeLinkPath(linkPath: string, force: boolean): Promise<{ ok: true } | { ok: false; issue: BindingIssue; message: string }> {
  if (!existsSync(linkPath)) return { ok: true };

  const st = await lstat(linkPath);
  if (st.isSymbolicLink()) {
    await unlink(linkPath);
    return { ok: true };
  }

  if (force && st.isDirectory() && (await pathIsEmptyDirectory(linkPath))) {
    await rm(linkPath, { recursive: true });
    return { ok: true };
  }

  return {
    ok: false,
    issue: 'not_symlink',
    message: `Path exists and is not a symlink: ${linkPath}`,
  };
}

export async function publishSkillBinding(
  config: CsmConfig,
  platform: PlatformDefinition,
  skill: Pick<SkillSummary, 'skillId' | 'name' | 'relativePath' | 'source'>,
  opts?: PublishBatchOptions,
): Promise<PublishSkillResult> {
  assertPublishablePlatform(platform);
  if (skill.source !== 'personal') {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'conflict',
      linkPath: '',
      target: '',
      issue: 'wrong_target',
      message: 'Only personal skills can be published',
    };
  }

  const personalRoot = config.paths.personalRoot;
  const target = canonicalDir(personalRoot, skill.relativePath);
  const linkPath = linkPathFor(platform, skill.name);
  const dryRun = opts?.dryRun === true;
  const force = opts?.force === true;

  if (!existsSync(target)) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'conflict',
      linkPath,
      target,
      issue: 'missing',
      message: `Canonical skill directory missing: ${target}`,
    };
  }

  const current = await checkPlatformBinding(
    { name: skill.name, relativePath: skill.relativePath },
    personalRoot,
    platform,
  );

  if (current.ok) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'skipped',
      linkPath,
      target,
    };
  }

  if (current.issue === 'not_symlink') {
    if (dryRun) {
      return {
        skillId: skill.skillId,
        name: skill.name,
        action: 'dry_run',
        linkPath,
        target,
        issue: 'not_symlink',
        message: force
          ? 'Would remove empty directory and create symlink'
          : 'Conflict: pass force to replace empty directory',
      };
    }
    const removed = await removeLinkPath(linkPath, force);
    if (!removed.ok) {
      return {
        skillId: skill.skillId,
        name: skill.name,
        action: 'conflict',
        linkPath,
        target,
        issue: removed.issue,
        message: removed.message,
      };
    }
  } else if (existsSync(linkPath)) {
    if (dryRun) {
      return {
        skillId: skill.skillId,
        name: skill.name,
        action: 'dry_run',
        linkPath,
        target,
        issue: current.issue,
        message: 'Would repair symlink',
      };
    }
    const removed = await removeLinkPath(linkPath, true);
    if (!removed.ok) {
      return {
        skillId: skill.skillId,
        name: skill.name,
        action: 'conflict',
        linkPath,
        target,
        issue: removed.issue,
        message: removed.message,
      };
    }
  } else if (dryRun) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'dry_run',
      linkPath,
      target,
      issue: 'missing',
      message: 'Would create symlink',
    };
  }

  await mkdir(platform.globalRoot, { recursive: true });
  await symlink(target, linkPath);

  const action: PublishAction =
    current.issue === 'missing' ? 'created' : 'repaired';

  return {
    skillId: skill.skillId,
    name: skill.name,
    action,
    linkPath,
    target,
  };
}

export async function repairSkillBinding(
  config: CsmConfig,
  platform: PlatformDefinition,
  skill: Pick<SkillSummary, 'skillId' | 'name' | 'relativePath' | 'source'>,
  opts?: PublishBatchOptions,
): Promise<PublishSkillResult> {
  return publishSkillBinding(config, platform, skill, opts);
}

export async function unpublishSkillBinding(
  config: CsmConfig,
  platform: PlatformDefinition,
  skill: Pick<SkillSummary, 'skillId' | 'name' | 'relativePath' | 'source'>,
  opts?: PublishBatchOptions,
): Promise<PublishSkillResult> {
  assertPublishablePlatform(platform);
  const linkPath = linkPathFor(platform, skill.name);
  const target = canonicalDir(config.paths.personalRoot, skill.relativePath);

  if (!existsSync(linkPath)) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'skipped',
      linkPath,
      target,
    };
  }

  if (opts?.dryRun) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'dry_run',
      linkPath,
      target,
      message: 'Would remove symlink',
    };
  }

  const st = await lstat(linkPath);
  if (!st.isSymbolicLink()) {
    return {
      skillId: skill.skillId,
      name: skill.name,
      action: 'conflict',
      linkPath,
      target,
      issue: 'not_symlink',
      message: `Refusing to remove non-symlink path: ${linkPath}`,
    };
  }

  const currentTarget = resolve(platform.globalRoot, await readlink(linkPath));
  await unlink(linkPath);

  return {
    skillId: skill.skillId,
    name: skill.name,
    action: 'unpublished',
    linkPath,
    target: currentTarget,
  };
}

function summarize(items: PublishSkillResult[]): PublishBatchResult['summary'] {
  return {
    created: items.filter((i) => i.action === 'created').length,
    skipped: items.filter((i) => i.action === 'skipped').length,
    repaired: items.filter((i) => i.action === 'repaired').length,
    conflicts: items.filter((i) => i.action === 'conflict').length,
    unpublished: items.filter((i) => i.action === 'unpublished').length,
  };
}

export async function publishSkillBatch(
  config: CsmConfig,
  platformId: string,
  skills: SkillSummary[],
  opts?: PublishBatchOptions,
): Promise<PublishBatchResult> {
  const platform = getPlatformById(config, platformId);
  if (!platform) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  assertPublishablePlatform(platform);

  const items: PublishSkillResult[] = [];
  for (const skill of skills) {
    items.push(await publishSkillBinding(config, platform, skill, opts));
  }

  return {
    platformId: platform.id,
    dryRun: opts?.dryRun === true,
    items,
    summary: summarize(items),
  };
}

export async function repairSkillBatch(
  config: CsmConfig,
  platformId: string,
  skills: SkillSummary[],
  opts?: PublishBatchOptions,
): Promise<PublishBatchResult> {
  return publishSkillBatch(config, platformId, skills, opts);
}

export function targetPlatformsFromConfig(config: CsmConfig): PlatformDefinition[] {
  return resolvePlatforms(config).filter(
    (p) => p.enabled && p.role !== 'canonical' && p.syncMode === 'symlink',
  );
}

export async function syncPlatformsBatch(
  config: CsmConfig,
  skills: SkillSummary[],
  opts?: PublishBatchOptions & { platformIds?: PlatformId[] },
): Promise<{ platforms: PublishBatchResult[] }> {
  const platformIds =
    opts?.platformIds?.length
      ? opts.platformIds
      : targetPlatformsFromConfig(config).map((p) => p.id);

  const platforms: PublishBatchResult[] = [];
  for (const platformId of platformIds) {
    platforms.push(await publishSkillBatch(config, platformId, skills, opts));
  }
  return { platforms };
}
