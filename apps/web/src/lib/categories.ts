/** Keep in sync with packages/core/src/skillId.ts */
export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__';

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

/** Legacy API trees used skill.name as folder id — detect and collapse to one bucket. */
function isLegacySkillLeafNode(node: SkillTreeNode): boolean {
  return node.skillCount === 1 && node.children.length === 0;
}

function collapseLegacyFlatNodes(nodes: SkillTreeNode[]): SkillTreeNode[] {
  if (nodes.length === 0) return nodes;
  const hasUncategorized = nodes.some((n) => n.id === UNCATEGORIZED_CATEGORY_ID);
  const legacyLeaves = nodes.filter(isLegacySkillLeafNode);
  if (legacyLeaves.length === 0) return nodes;

  const kept = nodes.filter((n) => !isLegacySkillLeafNode(n));
  const rolledCount = legacyLeaves.reduce((sum, n) => sum + n.skillCount, 0);

  if (!hasUncategorized && rolledCount > 0) {
    kept.push({
      id: UNCATEGORIZED_CATEGORY_ID,
      label: UNCATEGORIZED_CATEGORY_ID,
      skillCount: rolledCount,
      children: [],
    });
  }

  return kept.length > 0
    ? kept
    : [
        {
          id: UNCATEGORIZED_CATEGORY_ID,
          label: UNCATEGORIZED_CATEGORY_ID,
          skillCount: rolledCount,
          children: [],
        },
      ];
}

/** Normalize API tree so flat skill dirs don't appear as fake one-skill categories. */
export function normalizeSkillsTree(tree: SkillsTree): SkillsTree {
  return {
    personal: collapseLegacyFlatNodes(tree.personal),
    project: tree.project.map((ws) => ({
      ...ws,
      categories: collapseLegacyFlatNodes(ws.categories),
    })),
  };
}

export function matchesCategoryPath(
  skill: { categoryPath: string; name?: string },
  categoryPath: string,
): boolean {
  if (!categoryPath) return true;
  if (categoryPath === UNCATEGORIZED_CATEGORY_ID) {
    return !skill.categoryPath;
  }
  if (skill.name && skill.name === categoryPath) {
    return true;
  }
  return (
    skill.categoryPath === categoryPath ||
    skill.categoryPath.startsWith(`${categoryPath}/`)
  );
}
