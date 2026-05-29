import { lstat, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PlatformBindingStatus, PlatformDefinition } from './types.js';
import { resolveEffectiveGlobalRoot } from './registry.js';

export type SkillBindingInput = {
  name: string;
  relativePath: string;
};

function canonicalSkillDir(personalRoot: string, relativePath: string): string {
  return resolve(join(personalRoot, relativePath));
}

/** Check one skill × one platform binding (M7: read-only). */
export async function checkPlatformBinding(
  skill: SkillBindingInput,
  personalRoot: string,
  platform: PlatformDefinition,
): Promise<PlatformBindingStatus> {
  const canonicalDir = canonicalSkillDir(personalRoot, skill.relativePath);
  const globalRoot = resolveEffectiveGlobalRoot(platform);

  if (platform.role === 'canonical' || platform.syncMode === 'none') {
    const exists = existsSync(canonicalDir);
    return {
      platformId: platform.id,
      mode: 'none',
      expectedPath: canonicalDir,
      exists,
      ok: exists,
      target: exists ? canonicalDir : null,
      issue: exists ? undefined : 'missing',
    };
  }

  const linkPath = join(globalRoot, skill.name);
  const expected = canonicalDir;

  if (!existsSync(linkPath)) {
    return {
      platformId: platform.id,
      mode: platform.syncMode,
      expectedPath: linkPath,
      exists: false,
      ok: false,
      target: null,
      issue: 'missing',
    };
  }

  if (platform.syncMode === 'symlink') {
    try {
      const st = await lstat(linkPath);
      if (!st.isSymbolicLink()) {
        return {
          platformId: platform.id,
          mode: platform.syncMode,
          expectedPath: linkPath,
          exists: true,
          ok: false,
          target: linkPath,
          issue: 'not_symlink',
        };
      }
      const target = await readlink(linkPath);
      const resolved = resolve(globalRoot, target);
      const ok = resolved === expected;
      return {
        platformId: platform.id,
        mode: platform.syncMode,
        expectedPath: linkPath,
        exists: true,
        ok,
        target: resolved,
        issue: ok ? undefined : 'wrong_target',
      };
    } catch {
      return {
        platformId: platform.id,
        mode: platform.syncMode,
        expectedPath: linkPath,
        exists: true,
        ok: false,
        target: null,
        issue: 'wrong_target',
      };
    }
  }

  return {
    platformId: platform.id,
    mode: platform.syncMode,
    expectedPath: linkPath,
    exists: true,
    ok: false,
    target: linkPath,
    issue: 'wrong_target',
  };
}

export async function checkSkillBindings(
  skill: SkillBindingInput,
  personalRoot: string,
  platforms: PlatformDefinition[],
): Promise<PlatformBindingStatus[]> {
  const results: PlatformBindingStatus[] = [];
  for (const platform of platforms) {
    if (!platform.enabled) continue;
    results.push(await checkPlatformBinding(skill, personalRoot, platform));
  }
  return results;
}

export function bindingHasIssue(status: PlatformBindingStatus): boolean {
  return !status.ok && status.issue !== undefined;
}

export function targetPlatforms(platforms: PlatformDefinition[]): PlatformDefinition[] {
  return platforms.filter((p) => p.enabled && p.syncMode !== 'none' && p.role !== 'canonical');
}
