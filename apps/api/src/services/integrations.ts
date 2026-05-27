import {
  type CsmConfig,
  listAgentsLinksHealth,
  openSkillTarget,
  runSyncAgentsScript,
} from '@csm/core';
import { ApiError } from '../errors.js';
import { loadAllSkills } from './skills.js';

export async function syncAgents(config: CsmConfig) {
  return runSyncAgentsScript(config.paths.personalRoot);
}

export async function getAgentsLinks(config: CsmConfig) {
  const agentsRoot = config.paths.agentsRoot;
  if (!agentsRoot) {
    return { items: [] };
  }
  const { personal } = await loadAllSkills(config);
  return listAgentsLinksHealth(personal, agentsRoot, config.paths.personalRoot);
}

export async function openTarget(
  config: CsmConfig,
  body: { skillId: string; target: 'folder' | 'editor' | 'terminal' },
) {
  try {
    return await openSkillTarget(config, body.skillId, body.target);
  } catch (e) {
    throw new ApiError(
      'INTERNAL_ERROR',
      e instanceof Error ? e.message : 'Failed to open target',
    );
  }
}
