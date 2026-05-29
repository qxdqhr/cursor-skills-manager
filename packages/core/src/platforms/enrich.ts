import type { SkillSummary } from '../types.js';
import type { CsmConfig } from '../config.js';
import { checkSkillBindings, targetPlatforms } from './checkBinding.js';
import { agentsLinkFromBindings, resolvePlatforms } from './registry.js';
import type { PlatformBindingStatus } from './types.js';

export async function enrichPersonalSkillsWithBindings(
  config: CsmConfig,
  skills: SkillSummary[],
): Promise<void> {
  const platforms = resolvePlatforms(config);
  const targets = targetPlatforms(platforms);
  if (targets.length === 0) return;

  for (const skill of skills) {
    if (skill.source !== 'personal') continue;
    const bindings = await checkSkillBindings(
      { name: skill.name, relativePath: skill.relativePath },
      config.paths.personalRoot,
      targets,
    );
    skill.bindings = bindings;
    skill.platforms = bindings.filter((b) => b.ok).map((b) => b.platformId);
    skill.agentsLink = agentsLinkFromBindings(bindings);
  }
}

export function skillHasBindingIssue(skill: SkillSummary): boolean {
  if (!skill.bindings?.length) return false;
  return skill.bindings.some((b) => !b.ok && b.issue);
}

export function skillPublishedOnPlatform(skill: SkillSummary, platformId: string): boolean {
  return skill.platforms?.includes(platformId as PlatformBindingStatus['platformId']) ?? false;
}
