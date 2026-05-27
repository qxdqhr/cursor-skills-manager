#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
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
  console.error('No api.token in config — start API once to generate');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

const health = await req('/health');
console.log('health', health.status, health.json.data?.indexOk);

const skills = await req('/skills', { headers });
console.log('skills', skills.status, 'total', skills.json.data?.total);

const search = await req('/search?q=android', { headers });
console.log('search android', search.status, 'hits', search.json.data?.items?.length ?? 0);

const tree = await req('/skills/tree', { headers });
console.log('tree', tree.status);

const rebuild = await req('/index/rebuild', { method: 'POST', headers });
console.log('rebuild', rebuild.status, rebuild.json.data);

if (!skills.json.ok || (skills.json.data?.total ?? 0) < 17) {
  console.error('M2 verify failed: expected >= 17 skills');
  process.exit(1);
}
if (!search.json.ok || (search.json.data?.items?.length ?? 0) < 1) {
  console.error('M2 verify failed: search android expected hits');
  process.exit(1);
}
console.log('M2 verify ok');
