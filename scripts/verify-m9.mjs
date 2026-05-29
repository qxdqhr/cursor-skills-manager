#!/usr/bin/env node
import { loadConfig } from '../packages/core/dist/config.js';

const base = `http://127.0.0.1:${process.env.CSM_API_PORT ?? '3847'}/api/v1`;

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const json = await res.json();
  return { status: res.status, json };
}

const cfg = await loadConfig();
const token = cfg.api.token;
if (!token) {
  console.error('No api.token — start API once');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

const health = await req('/health');
if (!health.json.ok) {
  console.error('API not reachable');
  process.exit(1);
}

const platforms = await req('/platforms', { headers });
if (!platforms.json.ok) {
  console.error('platforms failed', platforms.json);
  process.exit(1);
}

const items = platforms.json.data?.items ?? [];
console.log('platforms', items.length);
for (const p of items) {
  console.log(
    ' ',
    p.id,
    'enabled',
    p.enabled,
    'cliInstalled',
    p.cliInstalled,
    p.cliPath ? `(${p.cliPath})` : '',
  );
  if (typeof p.cliInstalled !== 'boolean') {
    console.error('missing cliInstalled on', p.id);
    process.exit(1);
  }
}

const opencode = items.find((p) => p.id === 'opencode');
if (opencode && !opencode.alternateRoots?.length) {
  console.error('opencode should expose alternateRoots');
  process.exit(1);
}

console.log('M9 verify ok');
