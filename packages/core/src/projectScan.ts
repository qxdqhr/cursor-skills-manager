import { glob } from 'glob';
import { dirname, resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { ProjectWorkspace, SkillSummary } from './types.js';
import { expandHome, toPosixPath } from './paths.js';
import { parseSkillMdFile } from './parse.js';
import { validateSkill } from './validate.js';
import { buildSkillId, parseCategoryPath, skillNameFromDir } from './skillId.js';

export interface ScanProjectOptions {
  globs?: string[];
}

const DEFAULT_GLOBS = ['~/project/**/.cursor/skills'];

function workspaceIdFromSkillsRoot(skillsRoot: string): string {
  const workspacePath = skillsRoot.replace(/\/\.cursor\/skills\/?$/, '');
  const parts = workspacePath.split('/');
  return parts[parts.length - 1] || 'project';
}

async function skillFromPath(
  skillMdPath: string,
  skillsRoot: string,
  workspace: ProjectWorkspace,
): Promise<SkillSummary | null> {
  const skillDir = dirname(skillMdPath);
  const name = skillNameFromDir(skillDir);
  const rel = toPosixPath(skillDir.slice(skillsRoot.length).replace(/^[/\\]/, ''));
  try {
    const parsed = await parseSkillMdFile(skillMdPath);
    const validation = validateSkill({
      directoryName: name,
      frontmatter: parsed.frontmatter,
    });
    const st = await stat(skillMdPath);
    let hasScripts = false;
    try {
      const ss = await stat(resolve(skillDir, 'scripts'));
      hasScripts = ss.isDirectory();
    } catch {
      /* no scripts */
    }
    return {
      skillId: buildSkillId('project', skillsRoot, skillDir, workspace.workspaceId),
      source: 'project',
      readOnly: true,
      name,
      description: parsed.frontmatter.description || '',
      categoryPath: parseCategoryPath(rel, name),
      relativePath: rel,
      rootPath: skillsRoot,
      skillMdPath: skillMdPath,
      hasScripts,
      mtimeMs: st.mtimeMs,
      validation,
    };
  } catch {
    return null;
  }
}

/** 按 glob 扫描项目内 `.cursor/skills` */
export async function scanProjectSkills(options: ScanProjectOptions = {}): Promise<{
  workspaces: ProjectWorkspace[];
  skills: SkillSummary[];
}> {
  const patterns = (options.globs ?? DEFAULT_GLOBS).map(expandHome);
  const skillsRoots = new Set<string>();

  for (const pattern of patterns) {
    const matches = await glob(pattern, { absolute: true });
    for (const d of matches) {
      if (!existsSync(d)) continue;
      try {
        const st = await stat(d);
        if (st.isDirectory()) skillsRoots.add(d);
      } catch {
        /* skip */
      }
    }
  }

  const workspaces: ProjectWorkspace[] = [];
  const skills: SkillSummary[] = [];

  for (const skillsRoot of skillsRoots) {
    const workspace: ProjectWorkspace = {
      workspaceId: workspaceIdFromSkillsRoot(skillsRoot),
      workspacePath: skillsRoot.replace(/\/\.cursor\/skills\/?$/, ''),
      skillsRoot,
    };
    workspaces.push(workspace);

    const files = await glob('**/SKILL.md', {
      cwd: skillsRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**'],
    });

    for (const skillMd of files) {
      const s = await skillFromPath(skillMd, skillsRoot, workspace);
      if (s) skills.push(s);
    }
  }

  skills.sort((a, b) => a.skillId.localeCompare(b.skillId));
  workspaces.sort((a, b) => a.workspaceId.localeCompare(b.workspaceId));
  return { workspaces, skills };
}
