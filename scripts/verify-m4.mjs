#!/usr/bin/env node
import { loadConfig } from '../packages/core/dist/config.js';

const base = `http://127.0.0.1:${process.env.CSM_API_PORT ?? '3847'}/api/v1`;
const testName = `csm-verify-${Date.now()}`;

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const json = await res.json();
  return { status: res.status, json };
}

const cfg = await loadConfig();
const token = cfg.api.token;
if (!token) {
  console.error('No api.token — start API once to generate');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const health = await req('/health');
if (!health.json.ok) {
  console.error('API not reachable — run pnpm dev:api');
  process.exit(1);
}
console.log('health ok');

const badValidate = await req('/skills/validate', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    frontmatter: { name: 'INVALID NAME', description: '' },
    bodyMarkdown: '# x',
  }),
});
console.log('validate invalid', badValidate.status, badValidate.json.data?.ok);
if (badValidate.json.data?.ok !== false) {
  console.error('expected validation failure');
  process.exit(1);
}

const created = await req('/skills', {
  method: 'POST',
  headers,
  body: JSON.stringify({ name: testName, categoryPath: '', template: 'blank' }),
});
console.log('create', created.status, created.json.data?.skillId);
if (!created.json.ok || created.status !== 201) {
  console.error('create failed', created.json);
  process.exit(1);
}

const skillId = created.json.data.skillId;

const updated = await req(`/skills/${encodeURIComponent(skillId)}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    frontmatter: {
      name: testName,
      description: 'M4 verify skill — safe to delete',
    },
    bodyMarkdown: '# M4 verify\n\nUpdated body.',
  }),
});
console.log('put', updated.status, updated.json.data?.description);
if (!updated.json.ok) {
  console.error('put failed', updated.json);
  process.exit(1);
}

const projectSkills = await req('/skills?source=project', { headers });
const firstProject = projectSkills.json.data?.items?.[0];
if (firstProject) {
  const forbidden = await req(`/skills/${encodeURIComponent(firstProject.skillId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      frontmatter: { name: firstProject.name, description: 'x' },
      bodyMarkdown: '# x',
    }),
  });
  console.log('put project (expect 403)', forbidden.status);
  if (forbidden.status !== 403) {
    console.error('expected 403 for project skill');
    process.exit(1);
  }
}

const files = await req(`/skills/${encodeURIComponent(skillId)}/files`, { headers });
console.log('files', files.status, files.json.data?.files?.length ?? 0);

const removed = await req(`/skills/${encodeURIComponent(skillId)}?mode=hard`, {
  method: 'DELETE',
  headers,
});
console.log('delete', removed.status);
if (!removed.json.ok) {
  console.error('delete failed', removed.json);
  process.exit(1);
}

console.log('M4 verify ok');
