import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { SkillFrontmatter, SkillSummary } from './types.js';
import { assertInsideRoot, toPosixPath } from './paths.js';
import { parseSkillMdFile } from './parse.js';
import { serializeSkillMd } from './serialize.js';
import { validateSkill } from './validate.js';
import { buildSkillId, skillNameFromDir } from './skillId.js';
import { scanPersonalSkillAt } from './scan.js';
import { SkillValidationError, SkillWriteError } from './skillErrors.js';

const SKIP_FILE_NAMES = new Set(['SKILL.md', '.DS_Store']);
const SKIP_DIR_NAMES = new Set(['.git', 'node_modules']);

export type SkillFileEntry = {
  relativePath: string;
  type: 'file' | 'directory';
  size?: number;
};

export function personalRelFromSkillId(skillId: string): string {
  if (!skillId.startsWith('personal:')) {
    throw new Error(`Not a personal skill id: ${skillId}`);
  }
  return skillId.slice('personal:'.length);
}

export function resolvePersonalSkillDir(personalRoot: string, skillId: string): string {
  const rel = personalRelFromSkillId(skillId);
  const target = join(personalRoot, rel);
  return assertInsideRoot(target, personalRoot);
}

function assertWritableCategory(categoryPath: string, reserved: string[] = []): void {
  const reservedSet = new Set(['scripts', '.git', '.csm', ...reserved]);
  for (const part of categoryPath.split('/').filter(Boolean)) {
    if (reservedSet.has(part)) {
      throw new SkillWriteError(`Reserved segment "${part}"`, 'PATH_FORBIDDEN');
    }
  }
}

export async function writeSkillMdAtomic(
  skillMdPath: string,
  frontmatter: SkillFrontmatter,
  bodyMarkdown: string,
): Promise<void> {
  const content = serializeSkillMd(frontmatter, bodyMarkdown);
  const tmp = `${skillMdPath}.csm.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, skillMdPath);
}

export interface UpdateSkillInput {
  personalRoot: string;
  skillId: string;
  frontmatter: Partial<SkillFrontmatter>;
  bodyMarkdown: string;
  reservedDirNames?: string[];
  agentsRoot?: string;
}

export async function updatePersonalSkill(input: UpdateSkillInput): Promise<SkillSummary> {
  const skillDir = resolvePersonalSkillDir(input.personalRoot, input.skillId);
  const directoryName = skillNameFromDir(skillDir);
  const name = String(input.frontmatter.name ?? directoryName).trim();
  const description = String(input.frontmatter.description ?? '').trim();

  const frontmatter: SkillFrontmatter = {
    ...input.frontmatter,
    name,
    description,
  };

  const validation = validateSkill({
    directoryName,
    frontmatter,
    bodyMarkdown: input.bodyMarkdown,
  });
  if (!validation.ok) {
    throw new SkillValidationError(validation.errors);
  }

  const skillMdPath = join(skillDir, 'SKILL.md');
  await writeSkillMdAtomic(skillMdPath, frontmatter, input.bodyMarkdown);

  return scanPersonalSkillAt(input.personalRoot, skillDir, {
    agentsRoot: input.agentsRoot,
    checkAgents: Boolean(input.agentsRoot),
  });
}

export interface CreateSkillInput {
  personalRoot: string;
  name: string;
  categoryPath?: string;
  template?: 'blank';
  copyFromSkillId?: string | null;
  reservedDirNames?: string[];
  agentsRoot?: string;
}

const BLANK_BODY = (name: string) => `# ${name}

Describe when to use this skill.
`;

export async function createPersonalSkill(input: CreateSkillInput): Promise<SkillSummary> {
  const name = input.name.trim();
  const categoryPath = (input.categoryPath ?? '').trim().replace(/^\/+|\/+$/g, '');
  assertWritableCategory(categoryPath, input.reservedDirNames);

  const validation = validateSkill({
    directoryName: name,
    frontmatter: { name, description: 'TODO: describe this skill' },
  });
  if (!validation.ok) {
    throw new SkillValidationError(validation.errors);
  }

  const skillDir = assertInsideRoot(
    join(input.personalRoot, categoryPath, name),
    input.personalRoot,
  );

  if (existsSync(skillDir)) {
    throw new SkillWriteError(`Skill directory already exists: ${name}`, 'CONFLICT');
  }

  await mkdir(skillDir, { recursive: true });

  let frontmatter: SkillFrontmatter = {
    name,
    description: 'TODO: describe this skill',
  };
  let bodyMarkdown = BLANK_BODY(name);

  if (input.copyFromSkillId) {
    const sourceDir = resolvePersonalSkillDir(input.personalRoot, input.copyFromSkillId);
    const parsed = await parseSkillMdFile(join(sourceDir, 'SKILL.md'));
    frontmatter = { ...parsed.frontmatter, name };
    bodyMarkdown = parsed.bodyMarkdown;
  }

  await writeSkillMdAtomic(join(skillDir, 'SKILL.md'), frontmatter, bodyMarkdown);

  return scanPersonalSkillAt(input.personalRoot, skillDir, {
    agentsRoot: input.agentsRoot,
    checkAgents: Boolean(input.agentsRoot),
  });
}

export async function deletePersonalSkill(
  personalRoot: string,
  skillId: string,
  mode: 'soft' | 'hard' = 'hard',
): Promise<void> {
  const skillDir = resolvePersonalSkillDir(personalRoot, skillId);
  const name = basename(skillDir);

  if (mode === 'soft') {
    const trashRoot = join(personalRoot, '.csm', 'trash');
    await mkdir(trashRoot, { recursive: true });
    const dest = join(trashRoot, `${Date.now()}-${name}`);
    await rename(skillDir, dest);
    return;
  }

  await rm(skillDir, { recursive: true, force: true });
}

export async function listSkillFiles(skillDir: string): Promise<SkillFileEntry[]> {
  const { readdir } = await import('node:fs/promises');
  const out: SkillFileEntry[] = [];

  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (SKIP_FILE_NAMES.has(ent.name)) continue;
      if (ent.isDirectory() && SKIP_DIR_NAMES.has(ent.name)) continue;
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        out.push({ relativePath: rel, type: 'directory' });
        await walk(full, rel);
      } else {
        const st = await stat(full);
        out.push({ relativePath: rel, type: 'file', size: st.size });
      }
    }
  }

  await walk(skillDir, '');
  out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return out;
}

export function buildSkillIdFromDir(personalRoot: string, skillDir: string): string {
  return buildSkillId('personal', personalRoot, skillDir);
}

export async function readSkillFile(
  skillDir: string,
  relativePath: string,
): Promise<string> {
  const normalized = toPosixPath(relativePath).replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid relative path');
  }
  const full = assertInsideRoot(join(skillDir, normalized), skillDir);
  return readFile(full, 'utf8');
}
