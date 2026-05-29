import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SkillSummary } from './types.js';
import type { SkillLogicalMeta } from './skillMeta.js';

export function attachSkillMetas(
  skills: SkillSummary[],
  metas: Map<string, SkillLogicalMeta>,
): void {
  for (const skill of skills) {
    const meta = metas.get(skill.skillId);
    if (meta) skill.meta = meta;
  }
}

export async function writeInventoryToFile(
  personalRoot: string,
  markdown: string,
): Promise<string> {
  const path = join(personalRoot, 'skills-inventory.md');
  await writeFile(path, markdown, 'utf8');
  return path;
}
