import { UNCATEGORIZED_CATEGORY_ID } from './skillId.js';
import type { SkillSummary } from './types.js';

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

/** Build folder-only category tree (no per-skill leaf nodes). */
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
  let uncategorizedCount = 0;

  for (const skill of skills) {
    const parts = skill.categoryPath ? skill.categoryPath.split('/').filter(Boolean) : [];
    if (parts.length === 0) {
      uncategorizedCount += 1;
      continue;
    }

    let level = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      let node = level.find((n) => n.id === part);
      if (!node) {
        node = { id: part, label: part, skillCount: 0, children: [] };
        level.push(node);
      }
      if (i === parts.length - 1) {
        node.skillCount += 1;
      }
      level = node.children;
    }
  }

  rollUpCounts(root);
  sortTreeNodes(root);

  if (uncategorizedCount > 0) {
    root.push({
      id: UNCATEGORIZED_CATEGORY_ID,
      label: UNCATEGORIZED_CATEGORY_ID,
      skillCount: uncategorizedCount,
      children: [],
    });
  }

  return root;
}

function rollUpCounts(nodes: SkillTreeNode[]): number {
  let sum = 0;
  for (const node of nodes) {
    const childSum = rollUpCounts(node.children);
    if (childSum > 0) {
      node.skillCount = childSum;
    }
    sum += node.skillCount;
  }
  return sum;
}

function sortTreeNodes(nodes: SkillTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.id === UNCATEGORIZED_CATEGORY_ID) return 1;
    if (b.id === UNCATEGORIZED_CATEGORY_ID) return -1;
    return a.label.localeCompare(b.label);
  });
  for (const node of nodes) {
    sortTreeNodes(node.children);
  }
}

function buildProjectTrees(skills: SkillSummary[]): SkillsTree['project'] {
  const byWs = new Map<string, SkillSummary[]>();
  for (const skill of skills) {
    const ws = skill.skillId.split(':')[1] ?? 'project';
    const list = byWs.get(ws) ?? [];
    list.push(skill);
    byWs.set(ws, list);
  }
  return [...byWs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([workspaceId, list]) => ({
      workspaceId,
      workspacePath: list[0]?.rootPath.replace(/\/\.cursor\/skills\/?$/, '') ?? '',
      categories: buildCategoryTree(list),
    }));
}

export function matchesCategoryPath(
  skill: Pick<SkillSummary, 'categoryPath'> & { name?: string },
  categoryPath: string,
): boolean {
  if (!categoryPath) return true;
  if (categoryPath === UNCATEGORIZED_CATEGORY_ID) {
    return !skill.categoryPath;
  }
  if (skill.name === categoryPath) {
    return true;
  }
  return (
    skill.categoryPath === categoryPath ||
    skill.categoryPath.startsWith(`${categoryPath}/`)
  );
}
