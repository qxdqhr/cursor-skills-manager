import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import type { SkillFrontmatter } from './types.js';

export interface ParsedSkillMd {
  frontmatter: SkillFrontmatter;
  bodyMarkdown: string;
}

export function parseSkillMdContent(raw: string): ParsedSkillMd {
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;
  return {
    frontmatter: {
      ...fm,
      name: String(fm.name ?? ''),
      description: String(fm.description ?? '').trim(),
      paths: fm.paths as string | string[] | undefined,
      'disable-model-invocation': fm['disable-model-invocation'] as boolean | undefined,
      metadata: fm.metadata as Record<string, unknown> | undefined,
    },
    bodyMarkdown: content.trimStart(),
  };
}

export async function parseSkillMdFile(skillMdPath: string): Promise<ParsedSkillMd> {
  const raw = await readFile(skillMdPath, 'utf8');
  return parseSkillMdContent(raw);
}
