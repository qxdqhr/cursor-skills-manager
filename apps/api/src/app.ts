import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  CSM_VERSION,
  publicConfig,
  saveConfig,
  searchSkillIds,
  gitDirtySkillIds,
  type CsmConfig,
} from '@csm/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getContext, refreshIndex, type AppContext } from './context.js';
import { bearerAuth } from './middleware/auth.js';
import { ApiError, jsonError, jsonOk } from './errors.js';
import {
  buildSkillsTree,
  filterBySource,
  getSkillDetail,
  loadAllSkills,
} from './services/skills.js';
import {
  getSkillFilesFor,
  postSkill,
  putSkill,
  removeSkill,
  validateSkillDraft,
} from './services/skillWrite.js';
import { getGitDiff, getGitLog, getGitStatus, postGitCommit } from './services/git.js';
import { getAgentsLinks, openTarget, syncAgents } from './services/integrations.js';
import { listPlatformBindings, listPlatforms, publishPlatformSkills, repairPlatformSkills, syncPlatforms } from './services/platforms.js';

type Env = { Variables: { ctx: AppContext } };

export function createApp() {
  const app = new Hono<Env>().basePath('/api/v1');

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return 'http://localhost:5173';
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
        return 'http://localhost:5173';
      },
    }),
  );

  app.use('*', async (c, next) => {
    try {
      const ctx = await getContext();
      c.set('ctx', ctx);
      await next();
    } catch (e) {
      return jsonError(c, e instanceof Error ? e : new Error(String(e)));
    }
  });

  app.get('/health', async (c) => {
    const ctx = c.get('ctx');
    const personalRoot = ctx.config.paths.personalRoot;
    const rootExists = existsSync(personalRoot);
    let isGitRepo = false;
    if (rootExists) {
      isGitRepo = existsSync(join(personalRoot, '.git'));
    }
    return jsonOk(c, {
      status: 'ok',
      version: CSM_VERSION,
      personalRoot,
      personalRootExists: rootExists,
      isGitRepo,
      hasToken: Boolean(ctx.config.api.token),
      indexOk: true,
    });
  });

  app.use('*', async (c, next) => {
    const path = c.req.path;
    if (path === '/health' || path.endsWith('/health')) {
      await next();
      return;
    }
    await bearerAuth()(c, next);
  });

  app.get('/config', (c) => {
    const ctx = c.get('ctx');
    return jsonOk(c, publicConfig(ctx.config));
  });

  app.patch('/config', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as Partial<CsmConfig>;
    const next = await saveConfig(ctx.config.paths.personalRoot, body);
    ctx.config = next;
    return jsonOk(c, publicConfig(next));
  });

  app.get('/skills', async (c) => {
    const ctx = c.get('ctx');
    const q = c.req.query('q')?.trim();
    const source = c.req.query('source');
    const platform = c.req.query('platform')?.trim();
    const bindingIssue = c.req.query('bindingIssue') === 'true';
    const { all, personal } = await loadAllSkills(ctx.config);
    const dirtySet = await gitDirtySkillIds(ctx.config.paths.personalRoot, personal);
    let items = filterBySource(all, source).map((s) =>
      s.source === 'personal'
        ? { ...s, git: { dirty: dirtySet.has(s.skillId) } }
        : s,
    );

    if (c.req.query('gitDirty') === 'true') {
      items = items.filter((s) => s.git?.dirty);
    }

    if (bindingIssue) {
      items = items.filter((s) =>
        s.bindings?.some((b) => !b.ok && b.issue),
      );
    }

    if (platform) {
      items = items.filter((s) => s.platforms?.includes(platform as import('@csm/core').PlatformId));
    }

    if (q) {
      const hits = searchSkillIds(ctx.db, q);
      const idSet = new Set(hits.map((h) => h.skillId));
      items = items.filter((s) => idSet.has(s.skillId));
      const scoreMap = new Map(hits.map((h) => [h.skillId, h.score]));
      items.sort((a, b) => (scoreMap.get(b.skillId) ?? 0) - (scoreMap.get(a.skillId) ?? 0));
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return jsonOk(c, { items, total: items.length });
  });

  app.get('/skills/tree', async (c) => {
    const ctx = c.get('ctx');
    const { personal, project } = await loadAllSkills(ctx.config);
    return jsonOk(c, buildSkillsTree(personal, project));
  });

  app.post('/skills/validate', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as {
      skillId?: string;
      frontmatter: Record<string, unknown>;
      bodyMarkdown?: string;
    };
    const result = validateSkillDraft({
      skillId: body.skillId,
      frontmatter: body.frontmatter as import('@csm/core').SkillFrontmatter,
      bodyMarkdown: body.bodyMarkdown,
      personalRoot: ctx.config.paths.personalRoot,
    });
    return jsonOk(c, result);
  });

  app.post('/skills', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as {
      name: string;
      categoryPath?: string;
      template?: 'blank';
      copyFromSkillId?: string | null;
    };
    const detail = await postSkill(ctx, body);
    return c.json({ ok: true, data: detail }, 201);
  });

  app.get('/skills/:skillId/files', async (c) => {
    const ctx = c.get('ctx');
    const skillId = c.req.param('skillId');
    const result = await getSkillFilesFor(ctx.config, skillId);
    return jsonOk(c, result);
  });

  app.get('/skills/:skillId', async (c) => {
    const ctx = c.get('ctx');
    const skillId = c.req.param('skillId');
    const { all } = await loadAllSkills(ctx.config);
    const detail = await getSkillDetail(all, skillId);
    return jsonOk(c, detail);
  });

  app.put('/skills/:skillId', async (c) => {
    const ctx = c.get('ctx');
    const skillId = c.req.param('skillId');
    const body = (await c.req.json()) as {
      frontmatter: Record<string, unknown>;
      bodyMarkdown: string;
    };
    const detail = await putSkill(ctx, skillId, {
      frontmatter: body.frontmatter as import('@csm/core').SkillFrontmatter,
      bodyMarkdown: body.bodyMarkdown,
    });
    return jsonOk(c, detail);
  });

  app.delete('/skills/:skillId', async (c) => {
    const ctx = c.get('ctx');
    const skillId = c.req.param('skillId');
    const mode = c.req.query('mode') === 'soft' ? 'soft' : 'hard';
    const result = await removeSkill(ctx, skillId, mode);
    return jsonOk(c, result);
  });

  app.get('/search', async (c) => {
    const ctx = c.get('ctx');
    const q = c.req.query('q')?.trim() ?? '';
    if (!q) {
      return jsonOk(c, { items: [] });
    }
    const hits = searchSkillIds(ctx.db, q);
    const { all } = await loadAllSkills(ctx.config);
    const byId = new Map(all.map((s) => [s.skillId, s]));
    const items = hits
      .map((h) => {
        const skill = byId.get(h.skillId);
        if (!skill) return null;
        return {
          skillId: h.skillId,
          score: h.score,
          snippets: [{ field: 'description', text: skill.description.slice(0, 120) }],
        };
      })
      .filter(Boolean);
    return jsonOk(c, { items });
  });

  app.get('/git/status', async (c) => {
    const ctx = c.get('ctx');
    const data = await getGitStatus(ctx.config.paths.personalRoot);
    return jsonOk(c, data);
  });

  app.get('/git/diff', async (c) => {
    const ctx = c.get('ctx');
    const path = c.req.query('path')?.trim() || undefined;
    const data = await getGitDiff(ctx.config.paths.personalRoot, path);
    return jsonOk(c, data);
  });

  app.post('/git/commit', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as { message: string; paths?: string[] };
    const data = await postGitCommit(
      ctx.config.paths.personalRoot,
      body.message,
      body.paths,
    );
    return jsonOk(c, data);
  });

  app.get('/git/log', async (c) => {
    const ctx = c.get('ctx');
    const path = c.req.query('path')?.trim() || undefined;
    const limit = Number(c.req.query('limit') ?? '20');
    const data = await getGitLog(ctx.config.paths.personalRoot, {
      path,
      limit: Number.isFinite(limit) ? limit : 20,
    });
    return jsonOk(c, data);
  });

  app.post('/integrations/sync-agents', async (c) => {
    const ctx = c.get('ctx');
    const data = await syncAgents(ctx.config);
    return jsonOk(c, data);
  });

  app.get('/integrations/agents-links', async (c) => {
    const ctx = c.get('ctx');
    const data = await getAgentsLinks(ctx.config);
    return jsonOk(c, data);
  });

  app.get('/platforms', async (c) => {
    const ctx = c.get('ctx');
    const data = await listPlatforms(ctx.config);
    return jsonOk(c, data);
  });

  app.get('/platforms/:platformId/bindings', async (c) => {
    const ctx = c.get('ctx');
    const platformId = c.req.param('platformId');
    const data = await listPlatformBindings(ctx.config, platformId);
    return jsonOk(c, data);
  });

  app.post('/platforms/:platformId/publish', async (c) => {
    const ctx = c.get('ctx');
    const platformId = c.req.param('platformId');
    const body = (await c.req.json()) as {
      skillIds?: string[];
      all?: boolean;
      dryRun?: boolean;
      force?: boolean;
    };
    const data = await publishPlatformSkills(ctx.config, platformId, body);
    if (!body.dryRun) {
      await refreshIndex(ctx);
    }
    return jsonOk(c, data);
  });

  app.post('/platforms/:platformId/repair', async (c) => {
    const ctx = c.get('ctx');
    const platformId = c.req.param('platformId');
    const body = (await c.req.json()) as {
      skillIds?: string[];
      all?: boolean;
      dryRun?: boolean;
      force?: boolean;
    };
    const data = await repairPlatformSkills(ctx.config, platformId, body);
    if (!body.dryRun) {
      await refreshIndex(ctx);
    }
    return jsonOk(c, data);
  });

  app.post('/integrations/sync-platforms', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as {
      platformIds?: import('@csm/core').PlatformId[];
      skillIds?: string[];
      all?: boolean;
      dryRun?: boolean;
      force?: boolean;
    };
    const data = await syncPlatforms(ctx.config, body);
    if (!body.dryRun) {
      await refreshIndex(ctx);
    }
    return jsonOk(c, data);
  });

  app.post('/open', async (c) => {
    const ctx = c.get('ctx');
    const body = (await c.req.json()) as {
      skillId: string;
      target: 'folder' | 'editor' | 'terminal';
    };
    const data = await openTarget(ctx.config, body);
    return jsonOk(c, data);
  });

  app.post('/index/rebuild', async (c) => {
    const ctx = c.get('ctx');
    try {
      const result = await refreshIndex(ctx);
      return jsonOk(c, result);
    } catch (e) {
      throw new ApiError(
        'INDEX_ERROR',
        e instanceof Error ? e.message : 'Index rebuild failed',
      );
    }
  });

  app.onError((err, c) => jsonError(c, err));

  return app;
}
