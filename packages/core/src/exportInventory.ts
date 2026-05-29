import type { SkillLogicalMeta } from './skillMeta.js';
import type { SkillSummary } from './types.js';

export function buildInventoryMarkdown(
  skills: SkillSummary[],
  metas?: Map<string, SkillLogicalMeta>,
): string {
  const lines = [
    '# Skills Inventory',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| name | source | category | tags | favorite | description |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  const sorted = [...skills].sort((a, b) => a.name.localeCompare(b.name));
  for (const skill of sorted) {
    const meta = metas?.get(skill.skillId);
    const tags = meta?.tags?.join(', ') ?? '';
    const fav = meta?.favorite ? 'yes' : '';
    const desc = skill.description.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(
      `| ${skill.name} | ${skill.source} | ${skill.categoryPath || '—'} | ${tags} | ${fav} | ${desc} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function buildInventoryJson(
  skills: SkillSummary[],
  metas?: Map<string, SkillLogicalMeta>,
): string {
  const items = [...skills]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((skill) => ({
      ...skill,
      meta: metas?.get(skill.skillId) ?? null,
    }));
  return `${JSON.stringify({ generatedAt: new Date().toISOString(), items }, null, 2)}\n`;
}
