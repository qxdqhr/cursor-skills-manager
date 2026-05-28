const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { API_HOST, API_PORT } = require('./paths.js');

function spawnLogged(label, command, args, options) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[${label}] exited with code ${code}${signal ? ` signal ${signal}` : ''}`);
    }
  });

  return child;
}

function startBundledApi(apiDir, apiEntry) {
  if (!fs.existsSync(apiEntry)) {
    throw new Error(`API 入口不存在: ${apiEntry}`);
  }

  return spawnLogged(
    'csm/api',
    process.execPath,
    [apiEntry],
    {
      cwd: apiDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        CSM_API_HOST: API_HOST,
        CSM_API_PORT: String(API_PORT),
      },
    },
  );
}

function startDevApi(monorepoRoot) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'pnpm.cmd' : 'pnpm';

  return spawnLogged(
    'csm/api',
    command,
    ['--filter', '@csm/api', 'dev'],
    {
      cwd: monorepoRoot,
      shell: isWindows,
      env: {
        ...process.env,
        CSM_API_HOST: API_HOST,
        CSM_API_PORT: String(API_PORT),
      },
    },
  );
}

function stopChild(child) {
  if (!child || child.killed) {
    return;
  }
  child.kill('SIGTERM');
}

module.exports = {
  startBundledApi,
  startDevApi,
  stopChild,
};
