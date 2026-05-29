import {
  type CsmConfig,
  type SkillDetail,
  type SkillSummary,
  scanPersonalSkills,
  scanProjectSkills,
  parseSkillMdFile,
  buildSkillsTree,
  enrichPersonalSkillsWithBindings,
  type SkillsTree,
  type SkillTreeNode,
} from '@csm/core';
import { ApiError } from '../errors.js';

export async function loadAllSkills(config: CsmConfig): Promise<{
  all: SkillSummary[];
  personal: SkillSummary[];
  project: SkillSummary[];
}> {
  const personal = await scanPersonalSkills({
    root: config.paths.personalRoot,
    checkAgents: false,
  });
  await enrichPersonalSkillsWithBindings(config, personal);
  const { skills: project } = await scanProjectSkills({
    globs: config.paths.projectScanGlobs,
  });
  return { all: [...personal, ...project], personal, project };
}

export function filterBySource(
  items: SkillSummary[],
  source?: string | null,
): SkillSummary[] {
  if (source === 'personal') return items.filter((s) => s.source === 'personal');
  if (source === 'project') return items.filter((s) => s.source === 'project');
  return items;
}

export async function getSkillDetail(
  items: SkillSummary[],
  skillId: string,
): Promise<SkillDetail> {
  const decoded = decodeURIComponent(skillId);
  const summary = items.find((s) => s.skillId === decoded);
  if (!summary) {
    throw new ApiError('NOT_FOUND', `Skill not found: ${decoded}`);
  }
  const parsed = await parseSkillMdFile(summary.skillMdPath);
  return {
    ...summary,
    frontmatter: parsed.frontmatter,
    bodyMarkdown: parsed.bodyMarkdown,
  };
}

export type { SkillTreeNode, SkillsTree };
export { buildSkillsTree };
