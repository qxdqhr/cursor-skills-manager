import { getIndexStatus, openIndexDb, type CsmConfig } from '@csm/core';
import { loadAllSkills } from './skills.js';

export async function getIndexHealth(ctx: {
  config: CsmConfig;
  db: ReturnType<typeof openIndexDb>;
}) {
  const { all } = await loadAllSkills(ctx.config);
  return getIndexStatus(ctx.db, all.length);
}
