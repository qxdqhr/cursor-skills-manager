import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CSM_VERSION, defaultPersonalRoot } from '@csm/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const host = process.env.CSM_API_HOST ?? '127.0.0.1';
const port = Number(process.env.CSM_API_PORT ?? '3847');
const personalRoot = defaultPersonalRoot();

const app = new Hono().basePath('/api/v1');

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

app.get('/health', async (c) => {
  const rootExists = existsSync(personalRoot);
  let isGitRepo = false;
  if (rootExists) {
    try {
      isGitRepo = existsSync(join(personalRoot, '.git'));
    } catch {
      isGitRepo = false;
    }
  }

  return c.json({
    ok: true,
    data: {
      status: 'ok',
      version: CSM_VERSION,
      personalRoot,
      personalRootExists: rootExists,
      isGitRepo,
      hasToken: false,
      indexOk: false,
    },
  });
});

serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(`[csm/api] http://${info.address}:${info.port}/api/v1/health`);
    console.log(`[csm/api] personalRoot=${personalRoot}`);
  },
);
