import {
  type CsmConfig,
  type SkillDetail,
  type SkillSummary,
  scanPersonalSkills,
  scanProjectSkills,
  parseSkillMdFile,
} from '@csm/core';
import { ApiError } from '../errors.js';

export async function loadAllSkills(config: CsmConfig): Promise<{
  all: SkillSummary[];
  personal: SkillSummary[];
  project: SkillSummary[];
}> {
  const personal = await scanPersonalSkills({
    root: config.paths.personalRoot,
    agentsRoot: config.paths.agentsRoot,
    checkAgents: true,
  });
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

export type SkillTreeNode = {
  id: string;
  label: string;
  skillCount: number;
  children: SkillTreeNode[];
};

export type SkillsTree = {
  personal: SkillTreeNode[];
  project: {
    workspaceId: string;
    workspacePath: string;
    categories: SkillTreeNode[];
  }[];
};

export function buildSkillsTree(
  personal: SkillSummary[],
  project: SkillSummary[],
): SkillsTree {
  return {
    personal: buildCategoryTree(personal),
    project: buildProjectTrees(project),
  };
}

function buildCategoryTree(skills: SkillSummary[]): SkillTreeNode[] {
  const root: SkillTreeNode[] = [];
  for (const skill of skills) {
    const parts = skill.categoryPath ? skill.categoryPath.split('/') : [];
    let level = root;
    for (const part of parts) {
      let node = level.find((n) => n.id === part);
      if (!node) {
        node = { id: part, label: part, skillCount: 0, children: [] };
        level.push(node);
      }
      level = node.children;
    }
    const leafId = skill.name;
    let leaf = level.find((n) => n.id === leafId);
    if (!leaf) {
      leaf = { id: leafId, label: leafId, skillCount: 0, children: [] };
      level.push(leaf);
    }
    leaf.skillCount += 1;
  }
  incrementParentCounts(root);
  return root;
}

function incrementParentCounts(nodes: SkillTreeNode[]): number {
  let sum = 0;
  for (const n of nodes) {
    const childSum = incrementParentCounts(n.children);
    if (childSum > 0) n.skillCount = childSum;
    sum += n.skillCount;
  }
  return sum;
}

function buildProjectTrees(skills: SkillSummary[]): SkillsTree['project'] {
  const byWs = new Map<string, SkillSummary[]>();
  for (const s of skills) {
    const ws = s.skillId.split(':')[1] ?? 'project';
    const list = byWs.get(ws) ?? [];
    list.push(s);
    byWs.set(ws, list);
  }
  return [...byWs.entries()].map(([workspaceId, list]) => ({
    workspaceId,
    workspacePath: list[0]?.rootPath.replace(/\/\.cursor\/skills\/?$/, '') ?? '',
    categories: buildCategoryTree(list),
  }));
}
