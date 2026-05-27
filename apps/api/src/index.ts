import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { getContext } from './context.js';

const host = process.env.CSM_API_HOST ?? '127.0.0.1';
const port = Number(process.env.CSM_API_PORT ?? '3847');

const app = createApp();

async function main() {
  const ctx = await getContext();
  serve(
    {
      fetch: app.fetch,
      hostname: host,
      port,
    },
    (info) => {
      console.log(`[csm/api] http://${info.address}:${info.port}/api/v1/health`);
      console.log(`[csm/api] personalRoot=${ctx.config.paths.personalRoot}`);
      if (ctx.config.api.token) {
        console.log(`[csm/api] Bearer token configured (see .csm/config.json)`);
      }
    },
  );
}

main().catch((err) => {
  console.error('[csm/api] failed to start', err);
  process.exit(1);
});
