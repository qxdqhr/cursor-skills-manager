import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentsLinkStatus, SkillSummary } from './types.js';
import { checkAgentsLink } from './agentsLink.js';
import { resolvePersonalSkillDir } from './writeSkill.js';
import { assertInsideRoot } from './paths.js';
import type { CsmConfig } from './config.js';

const execFileAsync = promisify(execFile);

export type ScriptRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function runSyncAgentsScript(personalRoot: string): Promise<ScriptRunResult> {
  const script = join(personalRoot, 'scripts/sync-from-agents-skills.sh');
  if (!existsSync(script)) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: `Script not found: ${script}`,
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync('bash', [script], {
      cwd: personalRoot,
      maxBuffer: 20 * 1024 * 1024,
      env: {
        ...process.env,
        CURSOR_SKILLS: personalRoot,
        AGENTS_SKILLS: process.env.AGENTS_SKILLS ?? join(process.env.HOME ?? '', '.agents/skills'),
      },
    });
    return { exitCode: 0, stdout, stderr };
  } catch (e: unknown) {
    const err = e as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      exitCode: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message ?? String(e),
    };
  }
}

export type AgentsLinkItem = {
  name: string;
  skillId: string;
  agentsLink: AgentsLinkStatus;
};

export async function listAgentsLinksHealth(
  personalSkills: SkillSummary[],
  agentsRoot: string,
  personalRoot: string,
): Promise<{ items: AgentsLinkItem[] }> {
  const items: AgentsLinkItem[] = [];
  for (const skill of personalSkills) {
    if (skill.source !== 'personal') continue;
    const link = await checkAgentsLink(skill.name, agentsRoot, personalRoot);
    items.push({
      name: skill.name,
      skillId: skill.skillId,
      agentsLink: link,
    });
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return { items };
}

export async function openSkillTarget(
  config: CsmConfig,
  skillId: string,
  target: 'folder' | 'editor' | 'terminal',
): Promise<{ opened: string }> {
  const personalRoot = config.paths.personalRoot;
  const skillDir = resolvePersonalSkillDir(personalRoot, skillId);
  assertInsideRoot(skillDir, personalRoot);

  if (target === 'folder') {
    await execFileAsync('xdg-open', [skillDir]);
    return { opened: skillDir };
  }

  if (target === 'editor') {
    const editor = config.paths.editor?.trim() || 'code';
    const parts = editor.split(/\s+/);
    const cmd = parts[0] ?? 'code';
    const args = [...(parts.slice(1) ?? []), skillDir];
    await execFileAsync(cmd, args);
    return { opened: skillDir };
  }

  const term = process.env.CSM_TERMINAL ?? 'x-terminal-emulator';
  await execFileAsync(term, ['-e', 'bash', '-lc', `cd ${JSON.stringify(skillDir)}; exec bash`]);
  return { opened: skillDir };
}

/** 在资源管理器中打开主库根目录 */
export async function openPersonalRoot(personalRoot: string): Promise<{ opened: string }> {
  await execFileAsync('xdg-open', [personalRoot]);
  return { opened: personalRoot };
}
