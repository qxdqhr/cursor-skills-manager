import matter from 'gray-matter';
import type { SkillFrontmatter } from './types.js';

/** 将 frontmatter + 正文序列化为 SKILL.md 文本 */
export function serializeSkillMd(
  frontmatter: SkillFrontmatter,
  bodyMarkdown: string,
): string {
  const data: Record<string, unknown> = { ...frontmatter };
  const body = bodyMarkdown.endsWith('\n') ? bodyMarkdown : `${bodyMarkdown}\n`;
  return matter.stringify(body, data);
}
