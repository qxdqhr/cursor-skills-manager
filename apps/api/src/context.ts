import {
  type CsmConfig,
  ensureConfig,
  openIndexDb,
  initSchema,
  isIndexHealthy,
  indexRebuild,
  gitDirtySkillIds,
} from '@csm/core';
import { loadAllSkills } from './services/skills.js';

export type AppContext = {
  config: CsmConfig;
  db: ReturnType<typeof openIndexDb>;
};

let cached: AppContext | null = null;

export async function getContext(): Promise<AppContext> {
  if (cached) return cached;

  const config = await ensureConfig();
  const personalRoot = config.paths.personalRoot;
  const db = openIndexDb(personalRoot);
  await initSchema(db);

  if (!isIndexHealthy(db)) {
    const { all, personal } = await loadAllSkills(config);
    const dirty = await gitDirtySkillIds(personalRoot, personal);
    await indexRebuild(db, all, dirty);
  }

  cached = { config, db };
  return cached;
}

export async function refreshIndex(ctx: AppContext): Promise<{ count: number; durationMs: number }> {
  const { all, personal } = await loadAllSkills(ctx.config);
  const dirty = await gitDirtySkillIds(ctx.config.paths.personalRoot, personal);
  return indexRebuild(ctx.db, all, dirty);
}
