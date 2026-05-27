export const CSM_VERSION = '0.1.0';

/** 展开路径中的 `~` */
export function expandHome(input: string): string {
  if (input.startsWith('~/')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    return home ? `${home}${input.slice(1)}` : input;
  }
  return input;
}

/** 默认个人 skill 主库路径 */
export function defaultPersonalRoot(): string {
  return expandHome(process.env.CSM_PERSONAL_ROOT ?? '~/.cursor/skills');
}
