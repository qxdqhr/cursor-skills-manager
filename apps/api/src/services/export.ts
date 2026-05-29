import {
  buildInventoryJson,
  buildInventoryMarkdown,
  loadAllSkillMetas,
  type CsmConfig,
} from '@csm/core';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAllSkills } from './skills.js';

export async function exportInventory(
  config: CsmConfig,
  format: 'md' | 'json',
  writeToDisk = false,
) {
  const { all } = await loadAllSkills(config);
  const metas = await loadAllSkillMetas(config.paths.personalRoot);

  if (format === 'json') {
    const content = buildInventoryJson(all, metas);
    if (writeToDisk) {
      const path = join(config.paths.personalRoot, 'skills-inventory.json');
      await writeFile(path, content, 'utf8');
      return { format, content, path };
    }
    return { format, content };
  }

  const content = buildInventoryMarkdown(all, metas);
  if (writeToDisk) {
    const path = join(config.paths.personalRoot, 'skills-inventory.md');
    await writeFile(path, content, 'utf8');
    return { format, content, path };
  }
  return { format, content };
}
