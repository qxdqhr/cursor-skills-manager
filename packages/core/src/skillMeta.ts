import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { csmDir } from './config.js';

export const PRESET_TAGS = ['android', 'rn', 'web', 'docs', 'git', 'design'] as const;

export interface SkillLogicalMeta {
  skillId: string;
  categories: string[];
  tags: string[];
  favorite: boolean;
  note?: string;
}

export function skillMetaDir(personalRoot: string): string {
  return join(csmDir(personalRoot), 'skills');
}

/** Stable filename for a skillId (avoids leaf-name collisions). */
export function skillMetaFileKey(skillId: string): string {
  return skillId.replace(/:/g, '__').replace(/\//g, '__');
}

export function skillMetaPath(personalRoot: string, skillId: string): string {
  return join(skillMetaDir(personalRoot), `${skillMetaFileKey(skillId)}.json`);
}

export function defaultSkillMeta(skillId: string): SkillLogicalMeta {
  return {
    skillId,
    categories: [],
    tags: [],
    favorite: false,
  };
}

function normalizeMeta(skillId: string, parsed: Partial<SkillLogicalMeta>): SkillLogicalMeta {
  return {
    skillId,
    categories: Array.isArray(parsed.categories)
      ? parsed.categories.map(String).filter(Boolean)
      : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).filter(Boolean) : [],
    favorite: Boolean(parsed.favorite),
    note: parsed.note ? String(parsed.note) : undefined,
  };
}

export async function loadSkillMeta(
  personalRoot: string,
  skillId: string,
): Promise<SkillLogicalMeta | null> {
  const path = skillMetaPath(personalRoot, skillId);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as Partial<SkillLogicalMeta>;
  return normalizeMeta(skillId, parsed);
}

export async function saveSkillMeta(
  personalRoot: string,
  meta: SkillLogicalMeta,
): Promise<SkillLogicalMeta> {
  const dir = skillMetaDir(personalRoot);
  await mkdir(dir, { recursive: true });
  const next = normalizeMeta(meta.skillId, meta);
  await writeFile(skillMetaPath(personalRoot, meta.skillId), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export async function deleteSkillMeta(personalRoot: string, skillId: string): Promise<void> {
  const path = skillMetaPath(personalRoot, skillId);
  if (existsSync(path)) {
    await rm(path);
  }
}

export async function renameSkillMetaFile(
  personalRoot: string,
  oldSkillId: string,
  newSkillId: string,
): Promise<void> {
  const oldPath = skillMetaPath(personalRoot, oldSkillId);
  if (!existsSync(oldPath)) return;
  const meta = await loadSkillMeta(personalRoot, oldSkillId);
  if (!meta) return;
  meta.skillId = newSkillId;
  await saveSkillMeta(personalRoot, meta);
  await rm(oldPath);
}

export async function loadAllSkillMetas(personalRoot: string): Promise<Map<string, SkillLogicalMeta>> {
  const dir = skillMetaDir(personalRoot);
  const map = new Map<string, SkillLogicalMeta>();
  if (!existsSync(dir)) return map;

  const files = await readdir(dir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(dir, file), 'utf8');
      const parsed = JSON.parse(raw) as Partial<SkillLogicalMeta>;
      if (!parsed.skillId) continue;
      map.set(parsed.skillId, normalizeMeta(parsed.skillId, parsed));
    } catch {
      /* skip invalid */
    }
  }
  return map;
}
