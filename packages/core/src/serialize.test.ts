import { describe, it, expect } from 'vitest';
import { parseSkillMdContent } from './parse.js';
import { serializeSkillMd } from './serialize.js';

describe('serializeSkillMd', () => {
  it('round-trips name and description', () => {
    const raw = serializeSkillMd(
      { name: 'demo-skill', description: 'A demo' },
      '# Demo\n\nBody text.',
    );
    const parsed = parseSkillMdContent(raw);
    expect(parsed.frontmatter.name).toBe('demo-skill');
    expect(parsed.frontmatter.description).toBe('A demo');
    expect(parsed.bodyMarkdown).toContain('# Demo');
  });
});
