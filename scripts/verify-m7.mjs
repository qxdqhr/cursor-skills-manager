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
console.log('health ok, personalRoot:', health.json.data?.personalRoot);

const platforms = await req('/platforms', { headers });
console.log('platforms', platforms.status, 'items', platforms.json.data?.items?.length ?? 0);
if (!platforms.json.ok || (platforms.json.data?.items?.length ?? 0) < 3) {
  console.error('platforms failed or too few items', platforms.json);
  process.exit(1);
}

const enabled = platforms.json.data.items.filter((p) => p.enabled);
const sample = enabled.find((p) => p.id !== 'cursor') ?? enabled[0];
const bindings = await req(`/platforms/${sample.id}/bindings`, { headers });
console.log(
  'bindings',
  bindings.status,
  sample.id,
  'items',
  bindings.json.data?.items?.length ?? 0,
);
if (!bindings.json.ok) {
  console.error('platform bindings failed', bindings.json);
  process.exit(1);
}

const skillsAll = await req('/skills?source=personal', { headers });
console.log('skills personal', skillsAll.status, skillsAll.json.data?.total ?? 0);
if (!skillsAll.json.ok) {
  console.error('skills failed', skillsAll.json);
  process.exit(1);
}

const withBindings = skillsAll.json.data.items.filter((s) => s.bindings?.length);
console.log('skills with bindings[]', withBindings.length);
if (withBindings.length === 0 && skillsAll.json.data.total > 0) {
  console.warn('warn: no bindings on personal skills (all target platforms disabled?)');
}

const bindingIssue = await req('/skills?bindingIssue=true&source=personal', { headers });
console.log('skills bindingIssue filter', bindingIssue.status, bindingIssue.json.data?.total ?? 0);
if (!bindingIssue.json.ok) {
  console.error('bindingIssue filter failed', bindingIssue.json);
  process.exit(1);
}

const config = await req('/config', { headers });
console.log('config version', config.json.data?.version, 'platforms', Boolean(config.json.data?.platforms));
if (!config.json.ok || config.json.data?.version !== 2) {
  console.error('config v2 check failed', config.json);
  process.exit(1);
}

console.log('M7 verify ok');
