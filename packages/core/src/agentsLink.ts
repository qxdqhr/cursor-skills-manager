import { lstat, readlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { AgentsLinkStatus } from './types.js';

export async function checkAgentsLink(
  skillName: string,
  agentsRoot: string,
  personalRoot: string,
): Promise<AgentsLinkStatus> {
  const linkPath = join(agentsRoot, skillName);
  const expected = resolve(join(personalRoot, skillName));

  if (!existsSync(linkPath)) {
    return { exists: false, ok: false, target: null };
  }

  try {
    const st = await lstat(linkPath);
    if (!st.isSymbolicLink()) {
      return { exists: true, ok: false, target: linkPath };
    }
    const target = await readlink(linkPath);
    const resolved = resolve(agentsRoot, target);
    const ok = resolved === expected;
    return { exists: true, ok, target: resolved };
  } catch {
    return { exists: true, ok: false, target: null };
  }
}
