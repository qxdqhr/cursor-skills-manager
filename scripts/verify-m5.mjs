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
console.log('health ok, isGitRepo:', health.json.data?.isGitRepo);

const gitStatus = await req('/git/status', { headers });
console.log('git/status', gitStatus.status, gitStatus.json.data?.branch, 'clean', gitStatus.json.data?.clean);
if (!gitStatus.json.ok) {
  console.error('git status failed', gitStatus.json);
  process.exit(1);
}

const agentsLinks = await req('/integrations/agents-links', { headers });
console.log('agents-links', agentsLinks.status, 'items', agentsLinks.json.data?.items?.length ?? 0);
if (!agentsLinks.json.ok) {
  console.error('agents-links failed');
  process.exit(1);
}

const sync = await req('/integrations/sync-agents', { method: 'POST', headers });
console.log('sync-agents', sync.status, 'exitCode', sync.json.data?.exitCode);
if (!sync.json.ok) {
  console.error('sync failed', sync.json);
  process.exit(1);
}

const skillsDirty = await req('/skills?gitDirty=true', { headers });
console.log('skills gitDirty filter', skillsDirty.status, skillsDirty.json.data?.total ?? 0);

console.log('M5 verify ok');
