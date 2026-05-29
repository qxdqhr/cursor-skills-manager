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
  console.error('No api.token');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const indexStatus = await req('/index/status', { headers });
console.log('index/status', indexStatus.json.data);
if (!indexStatus.json.ok) process.exit(1);

const exportMd = await req('/export/inventory?format=md', { headers });
if (!exportMd.json.ok || !exportMd.json.data?.content?.includes('Skills Inventory')) {
  console.error('export md failed');
  process.exit(1);
}
console.log('export md ok, length', exportMd.json.data.content.length);

const personal = await req('/skills?source=personal', { headers });
const sample = personal.json.data?.items?.[0];
if (sample) {
  const meta = await req(`/skills/${encodeURIComponent(sample.skillId)}/meta`, { headers });
  console.log('meta get', meta.status);
  const patched = await req(`/skills/${encodeURIComponent(sample.skillId)}/meta`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ favorite: true, tags: ['docs'] }),
  });
  console.log('meta patch', patched.status, patched.json.data?.favorite);
}

console.log('v0.2 verify ok');
