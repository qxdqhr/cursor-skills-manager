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

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const health = await req('/health');
if (!health.json.ok) {
  console.error('API not reachable');
  process.exit(1);
}
console.log('health ok');

const platforms = await req('/platforms', { headers });
const target = platforms.json.data?.items?.find(
  (p) => p.enabled && p.id === 'agents' && p.syncMode === 'symlink',
);
if (!target) {
  console.error('agents platform not enabled');
  process.exit(1);
}

const skills = await req('/skills?source=personal', { headers });
const sample = skills.json.data?.items?.[0];
if (!sample) {
  console.error('no personal skills to test publish');
  process.exit(1);
}

const dryRun = await req(`/platforms/${target.id}/publish`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ skillIds: [sample.skillId], dryRun: true }),
});
console.log('publish dryRun', dryRun.status, dryRun.json.data?.summary);
if (!dryRun.json.ok) {
  console.error('dryRun failed', dryRun.json);
  process.exit(1);
}

const publish = await req(`/platforms/${target.id}/publish`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ skillIds: [sample.skillId] }),
});
console.log('publish', publish.status, publish.json.data?.summary);
if (!publish.json.ok) {
  console.error('publish failed', publish.json);
  process.exit(1);
}

const sync = await req('/integrations/sync-platforms', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    platformIds: ['agents'],
    skillIds: [sample.skillId],
    dryRun: true,
  }),
});
console.log('sync-platforms dryRun platforms', sync.json.data?.platforms?.length ?? 0);
if (!sync.json.ok) {
  console.error('sync-platforms failed', sync.json);
  process.exit(1);
}

console.log('M8 verify ok');
