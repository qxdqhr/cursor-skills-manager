import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { SkillSummary } from './types.js';
import { toPosixPath } from './paths.js';

const execFileAsync = promisify(execFile);

/** 根据 git status --porcelain 标记 personal skill 是否脏 */
export async function gitDirtySkillIds(
  personalRoot: string,
  personalSkills: SkillSummary[],
): Promise<Set<string>> {
  const dirty = new Set<string>();
  if (!existsSync(join(personalRoot, '.git'))) return dirty;

  let stdout: string;
  try {
    const result = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: personalRoot,
      maxBuffer: 10 * 1024 * 1024,
    });
    stdout = result.stdout;
  } catch {
    return dirty;
  }

  for (const line of stdout.split('\n')) {
    if (line.length < 4) continue;
    const filePath = toPosixPath(line.slice(3).trim());
    for (const skill of personalSkills) {
      const rel = skill.relativePath;
      if (filePath === rel || filePath.startsWith(`${rel}/`)) {
        dirty.add(skill.skillId);
      }
    }
  }
  return dirty;
}
