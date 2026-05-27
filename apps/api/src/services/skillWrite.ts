import {
  type CsmConfig,
  type SkillDetail,
  type SkillFrontmatter,
  type SkillSummary,
  SkillValidationError,
  SkillWriteError,
  createPersonalSkill,
  deletePersonalSkill,
  indexDelete,
  indexUpsert,
  listSkillFiles,
  parseSkillMdFile,
  updatePersonalSkill,
  validateSkill,
  gitDirtySkillIds,
  resolvePersonalSkillDir,
  skillNameFromDir,
  openIndexDb,
} from '@csm/core';
import { ApiError } from '../errors.js';
import { loadAllSkills } from './skills.js';

export function assertPersonalWritable(summary: SkillSummary): void {
  if (summary.source !== 'personal' || summary.readOnly) {
    throw new ApiError('FORBIDDEN', 'Only personal skills can be modified');
  }
}

export async function findSkillSummary(
  config: CsmConfig,
  skillId: string,
): Promise<SkillSummary> {
  const decoded = decodeURIComponent(skillId);
  const { all } = await loadAllSkills(config);
  const summary = all.find((s) => s.skillId === decoded);
  if (!summary) {
    throw new ApiError('NOT_FOUND', `Skill not found: ${decoded}`);
  }
  return summary;
}

export function validateSkillDraft(body: {
  skillId?: string;
  frontmatter: Partial<SkillFrontmatter>;
  bodyMarkdown?: string;
  personalRoot: string;
}): { ok: boolean; errors: { field: string; code: string; message: string }[] } {
  let directoryName = String(body.frontmatter.name ?? '').trim();
  if (body.skillId?.startsWith('personal:')) {
    try {
      const dir = resolvePersonalSkillDir(body.personalRoot, body.skillId);
      directoryName = skillNameFromDir(dir);
    } catch {
      /* use name from frontmatter */
    }
  }
  return validateSkill({
    directoryName,
    frontmatter: body.frontmatter,
    bodyMarkdown: body.bodyMarkdown,
  });
}

type WriteCtx = { config: CsmConfig; db: ReturnType<typeof openIndexDb> };

export async function putSkill(
  ctx: WriteCtx,
  skillId: string,
  body: { frontmatter: Partial<SkillFrontmatter>; bodyMarkdown: string },
): Promise<SkillDetail> {
  const summary = await findSkillSummary(ctx.config, skillId);
  assertPersonalWritable(summary);

  try {
    const updated = await updatePersonalSkill({
      personalRoot: ctx.config.paths.personalRoot,
      skillId: summary.skillId,
      frontmatter: body.frontmatter,
      bodyMarkdown: body.bodyMarkdown,
      reservedDirNames: ctx.config.reservedDirNames,
      agentsRoot: ctx.config.paths.agentsRoot,
    });

    const dirtySet = await gitDirtySkillIds(ctx.config.paths.personalRoot, [updated]);
    await indexUpsert(ctx.db, updated, dirtySet.has(updated.skillId));

    const parsed = await parseSkillMdFile(updated.skillMdPath);
    return { ...updated, frontmatter: parsed.frontmatter, bodyMarkdown: parsed.bodyMarkdown };
  } catch (e) {
    if (e instanceof SkillValidationError) {
      throw new ApiError('VALIDATION_ERROR', 'Validation failed', { errors: e.errors });
    }
    if (e instanceof SkillWriteError) {
      throw new ApiError(
        e.code === 'PATH_FORBIDDEN' ? 'FORBIDDEN' : 'CONFLICT',
        e.message,
      );
    }
    throw e;
  }
}

export async function postSkill(
  ctx: WriteCtx,
  body: {
    name: string;
    categoryPath?: string;
    template?: 'blank';
    copyFromSkillId?: string | null;
  },
): Promise<SkillDetail> {
  try {
    const created = await createPersonalSkill({
      personalRoot: ctx.config.paths.personalRoot,
      name: body.name,
      categoryPath: body.categoryPath,
      template: body.template,
      copyFromSkillId: body.copyFromSkillId,
      reservedDirNames: ctx.config.reservedDirNames,
      agentsRoot: ctx.config.paths.agentsRoot,
    });

    await indexUpsert(ctx.db, created, false);

    const parsed = await parseSkillMdFile(created.skillMdPath);
    return { ...created, frontmatter: parsed.frontmatter, bodyMarkdown: parsed.bodyMarkdown };
  } catch (e) {
    if (e instanceof SkillValidationError) {
      throw new ApiError('VALIDATION_ERROR', 'Validation failed', { errors: e.errors });
    }
    if (e instanceof SkillWriteError) {
      throw new ApiError(
        e.code === 'PATH_FORBIDDEN' ? 'FORBIDDEN' : 'CONFLICT',
        e.message,
      );
    }
    throw e;
  }
}

export async function removeSkill(
  ctx: WriteCtx,
  skillId: string,
  mode: 'soft' | 'hard',
): Promise<{ deleted: true; skillId: string }> {
  const summary = await findSkillSummary(ctx.config, skillId);
  assertPersonalWritable(summary);

  await deletePersonalSkill(ctx.config.paths.personalRoot, summary.skillId, mode);
  indexDelete(ctx.db, summary.skillId);

  return { deleted: true, skillId: summary.skillId };
}

export async function getSkillFilesFor(
  config: CsmConfig,
  skillId: string,
): Promise<{ files: Awaited<ReturnType<typeof listSkillFiles>> }> {
  const summary = await findSkillSummary(config, skillId);
  const skillDir = summary.skillMdPath.replace(/\/SKILL\.md$/, '');
  const files = await listSkillFiles(skillDir);
  return { files };
}
