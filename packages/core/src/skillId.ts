import { basename, resolve } from 'node:path';
import type { SkillSource } from './types.js';
import { toPosixPath } from './paths.js';

export function buildSkillId(
  source: SkillSource,
  rootPath: string,
  skillDirPath: string,
  workspaceId?: string,
): string {
  const root = resolve(rootPath);
  const dir = resolve(skillDirPath);
  const rel = toPosixPath(dir.slice(root.length).replace(/^[/\\]+/, ''));
  if (source === 'personal') {
    return `personal:${rel}`;
  }
  const ws = workspaceId ?? basename(rootPath.replace(/\/\.cursor\/skills$/, ''));
  return `project:${ws}:${rel}`;
}

export function parseCategoryPath(relativePath: string, skillName: string): string {
  const posix = toPosixPath(relativePath);
  if (posix === skillName) return '';
  const prefix = posix.slice(0, -(skillName.length + 1));
  return prefix;
}

export function skillNameFromDir(skillDirPath: string): string {
  return basename(skillDirPath);
}

/** Virtual tree node id for skills at personal/project root (no category folder). */
export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__';
