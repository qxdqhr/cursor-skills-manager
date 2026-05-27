import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { SkillSummary, ValidationError } from './types.js';
import { parseSkillMdFile } from './parse.js';
import { validateSkill } from './validate.js';
import { buildSkillId, parseCategoryPath, skillNameFromDir } from './skillId.js';
import { toPosixPath } from './paths.js';
import { checkAgentsLink } from './agentsLink.js';

const SKIP_DIRS = new Set(['.git', '.csm', 'node_modules']);
const ROOT_RESERVED = new Set(['scripts', '.git', '.csm']);

export interface ScanPersonalOptions {
  root: string;
  agentsRoot?: string;
  checkAgents?: boolean;
}

async function hasScriptsDir(skillDir: string): Promise<boolean> {
  const p = join(skillDir, 'scripts');
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

function shouldSkipEntry(name: string, relativeParent: string): boolean {
  if (SKIP_DIRS.has(name)) return true;
  if (relativeParent === '' && ROOT_RESERVED.has(name)) return true;
  return false;
}

async function scanDir(
  dir: string,
  root: string,
  options: ScanPersonalOptions,
  out: SkillSummary[],
): Promise<void> {
  const skillMd = join(dir, 'SKILL.md');
  if (existsSync(skillMd)) {
    const name = skillNameFromDir(dir);
    const rel = toPosixPath(dir.slice(root.length).replace(/^[/\\]/, ''));
    let parsed: Awaited<ReturnType<typeof parseSkillMdFile>>;
    let validation: { ok: boolean; errors: ValidationError[] };
    try {
      parsed = await parseSkillMdFile(skillMd);
      validation = validateSkill({
        directoryName: name,
        frontmatter: parsed.frontmatter,
      });
    } catch (err) {
      parsed = {
        frontmatter: { name, description: '' },
        bodyMarkdown: '',
      };
      const parseErrors: ValidationError[] = [
        {
          field: 'SKILL.md',
          code: 'PARSE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      ];
      validation = { ok: false, errors: parseErrors };
    }
    const st = await stat(skillMd);
    const summary: SkillSummary = {
      skillId: buildSkillId('personal', root, dir),
      source: 'personal',
      readOnly: false,
      name,
      description: parsed.frontmatter.description || '',
      categoryPath: parseCategoryPath(rel, name),
      relativePath: rel,
      rootPath: root,
      skillMdPath: skillMd,
      hasScripts: await hasScriptsDir(dir),
      mtimeMs: st.mtimeMs,
      validation,
    };
    if (options.checkAgents && options.agentsRoot) {
      summary.agentsLink = await checkAgentsLink(name, options.agentsRoot, root);
    }
    out.push(summary);
    return;
  }

  let entries: { name: string; isDirectory: () => boolean }[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const relParent = toPosixPath(dir.slice(root.length).replace(/^[/\\]/, ''));

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (shouldSkipEntry(ent.name, relParent)) continue;
    await scanDir(join(dir, ent.name), root, options, out);
  }
}

/** 扫描单个 skill 目录（写入后刷新元数据） */
export async function scanPersonalSkillAt(
  root: string,
  skillDir: string,
  options: Pick<ScanPersonalOptions, 'agentsRoot' | 'checkAgents'> = {},
): Promise<SkillSummary> {
  const skillMd = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    throw new Error(`SKILL.md not found: ${skillMd}`);
  }
  const name = skillNameFromDir(skillDir);
  const rel = toPosixPath(skillDir.slice(root.length).replace(/^[/\\]/, ''));
  let parsed: Awaited<ReturnType<typeof parseSkillMdFile>>;
  let validation: { ok: boolean; errors: ValidationError[] };
  try {
    parsed = await parseSkillMdFile(skillMd);
    validation = validateSkill({
      directoryName: name,
      frontmatter: parsed.frontmatter,
    });
  } catch (err) {
    parsed = {
      frontmatter: { name, description: '' },
      bodyMarkdown: '',
    };
    validation = {
      ok: false,
      errors: [
        {
          field: 'SKILL.md',
          code: 'PARSE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
  const st = await stat(skillMd);
  const summary: SkillSummary = {
    skillId: buildSkillId('personal', root, skillDir),
    source: 'personal',
    readOnly: false,
    name,
    description: parsed.frontmatter.description || '',
    categoryPath: parseCategoryPath(rel, name),
    relativePath: rel,
    rootPath: root,
    skillMdPath: skillMd,
    hasScripts: await hasScriptsDir(skillDir),
    mtimeMs: st.mtimeMs,
    validation,
  };
  if (options.checkAgents && options.agentsRoot) {
    summary.agentsLink = await checkAgentsLink(name, options.agentsRoot, root);
  }
  return summary;
}

/** 递归扫描个人主库下所有 skill（含 SKILL.md 的目录） */
export async function scanPersonalSkills(options: ScanPersonalOptions): Promise<SkillSummary[]> {
  const root = options.root;
  if (!existsSync(root)) {
    return [];
  }
  const results: SkillSummary[] = [];
  await scanDir(root, root, options, results);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}
