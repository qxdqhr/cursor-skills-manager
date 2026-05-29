import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PlatformDefinition, PlatformId, PlatformSummary } from './types.js';
import { resolveEffectiveGlobalRoot, resolvePlatforms } from './registry.js';
import type { CsmConfig } from '../config.js';

const execFileAsync = promisify(execFile);

/** CLI binary names tried in order (first match wins). */
const CLI_COMMANDS: Partial<Record<PlatformId, string[]>> = {
  cursor: ['cursor', 'cursor-agent'],
  opencode: ['opencode'],
  claude: ['claude'],
  codex: ['codex'],
  agents: ['npx'],
};

export const PLATFORM_DOC_URLS: Record<PlatformId, string> = {
  cursor: 'https://cursor.com/docs/context/skills',
  agents: 'https://skills.sh/',
  opencode: 'https://opencode.ai/docs/skills',
  claude: 'https://docs.anthropic.com/en/docs/claude-code/skills',
  codex: 'https://cursor.com/docs/codex',
};

export async function whichCommand(command: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('sh', ['-lc', `command -v ${command}`], {
      timeout: 3000,
    });
    const path = stdout.trim();
    return path || null;
  } catch {
    return null;
  }
}

export async function probePlatformCli(
  platformId: PlatformId,
): Promise<{ installed: boolean; path?: string }> {
  const commands = CLI_COMMANDS[platformId];
  if (!commands?.length) {
    return { installed: false };
  }
  for (const cmd of commands) {
    const path = await whichCommand(cmd);
    if (path) {
      return { installed: true, path };
    }
  }
  return { installed: false };
}

export async function enrichPlatformSummary(
  platform: PlatformDefinition,
): Promise<PlatformSummary> {
  const globalRoot = resolveEffectiveGlobalRoot(platform);
  const cli = await probePlatformCli(platform.id);
  return {
    ...platform,
    globalRoot,
    cliInstalled: cli.installed,
    cliPath: cli.path,
  };
}

export async function resolvePlatformSummariesWithProbe(
  config: CsmConfig,
): Promise<PlatformSummary[]> {
  const platforms = resolvePlatforms(config);
  return Promise.all(platforms.map((p) => enrichPlatformSummary(p)));
}
