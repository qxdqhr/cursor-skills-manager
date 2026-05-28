#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(desktopRoot, '..', '..');
const bundleDir = path.join(desktopRoot, '.bundle');
const apiBundleDir = path.join(bundleDir, 'api');
const webBundleDir = path.join(bundleDir, 'web');

function run(command) {
  console.log(`[prepare-bundle] ${command}`);
  execSync(command, { cwd: monorepoRoot, stdio: 'inherit' });
}

function assertExists(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(`${label} 不存在: ${target}`);
  }
}

console.log('[prepare-bundle] 构建 core / api / web ...');
run('pnpm --filter @csm/core build');
run('pnpm --filter @csm/api build');
run('pnpm --filter @csm/web build');

assertExists(path.join(monorepoRoot, 'apps/api/dist/index.js'), 'API dist');
assertExists(path.join(monorepoRoot, 'apps/web/dist/index.html'), 'Web dist');

console.log('[prepare-bundle] 清理旧 bundle ...');
fs.rmSync(bundleDir, { recursive: true, force: true });
fs.mkdirSync(bundleDir, { recursive: true });

console.log('[prepare-bundle] pnpm deploy @csm/api ...');
run(`pnpm --filter @csm/api deploy "${apiBundleDir}" --prod`);

console.log('[prepare-bundle] 复制 web dist ...');
fs.cpSync(path.join(monorepoRoot, 'apps/web/dist'), webBundleDir, { recursive: true });

assertExists(path.join(apiBundleDir, 'dist/index.js'), 'API bundle entry');
assertExists(path.join(webBundleDir, 'index.html'), 'Web bundle index');

console.log('[prepare-bundle] 完成');
console.log(`  API: ${apiBundleDir}`);
console.log(`  Web: ${webBundleDir}`);
