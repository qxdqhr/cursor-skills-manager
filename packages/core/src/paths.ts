import { resolve, relative, sep } from 'node:path';

/** 展开路径中的 `~` */
export function expandHome(input: string): string {
  if (input.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    return home ? resolve(`${home}${input.slice(1)}`) : input;
  }
  if (input === '~') {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    return home || input;
  }
  return input;
}

/** 默认个人 skill 主库路径 */
export function defaultPersonalRoot(): string {
  return expandHome(process.env.CSM_PERSONAL_ROOT ?? '~/.cursor/skills');
}

/** 默认 agents 兼容目录 */
export function defaultAgentsRoot(): string {
  return expandHome(process.env.CSM_AGENTS_ROOT ?? '~/.agents/skills');
}

/** 解析后路径必须在 root 内，否则抛错 */
export function assertInsideRoot(targetPath: string, root: string): string {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(targetPath);
  const rel = relative(resolvedRoot, resolvedTarget);
  if (rel.startsWith('..') || (rel.length > 0 && rel.split(sep)[0] === '..')) {
    throw new Error(`Path escapes root: ${targetPath}`);
  }
  return resolvedTarget;
}

/** 相对路径统一为 POSIX（用于 skillId） */
export function toPosixPath(p: string): string {
  return p.replaceAll('\\', '/');
}
