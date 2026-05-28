const path = require('node:path');
const fs = require('node:fs');

const API_PORT = Number(process.env.CSM_API_PORT ?? '3847');
const UI_PORT = Number(process.env.CSM_DESKTOP_UI_PORT ?? '5173');
const API_HOST = process.env.CSM_API_HOST ?? '127.0.0.1';
const UI_HOST = process.env.CSM_DESKTOP_UI_HOST ?? '127.0.0.1';

function monorepoRootFromMain() {
  return path.resolve(__dirname, '..', '..', '..');
}

function bundledApiDir() {
  return path.join(process.resourcesPath, 'api');
}

function bundledWebDir() {
  return path.join(process.resourcesPath, 'web');
}

function localBundleApiDir() {
  return path.join(__dirname, '..', '.bundle', 'api');
}

function localBundleWebDir() {
  return path.join(__dirname, '..', '.bundle', 'web');
}

function hasBundledResources() {
  if (process.env.CSM_DESKTOP_FORCE_BUNDLE === '1') {
    return fs.existsSync(localBundleWebDir()) && fs.existsSync(localBundleApiDir());
  }
  if (process.resourcesPath && fs.existsSync(bundledWebDir()) && fs.existsSync(bundledApiDir())) {
    return true;
  }
  return fs.existsSync(localBundleWebDir()) && fs.existsSync(localBundleApiDir());
}

function resolveRuntimePaths(isPackaged) {
  if (isPackaged || hasBundledResources()) {
    const apiDir = isPackaged && fs.existsSync(bundledApiDir()) ? bundledApiDir() : localBundleApiDir();
    const webDir = isPackaged && fs.existsSync(bundledWebDir()) ? bundledWebDir() : localBundleWebDir();
    return {
      mode: 'bundled',
      apiDir,
      webDir,
      apiEntry: path.join(apiDir, 'dist', 'index.js'),
      uiUrl: `http://${UI_HOST}:${UI_PORT}`,
      apiHealthUrl: `http://${API_HOST}:${API_PORT}/api/v1/health`,
      monorepoRoot: null,
    };
  }

  return {
    mode: 'dev',
    apiDir: null,
    webDir: null,
    apiEntry: null,
    uiUrl: `http://${UI_HOST}:${UI_PORT}`,
    apiHealthUrl: `http://${API_HOST}:${API_PORT}/api/v1/health`,
    monorepoRoot: monorepoRootFromMain(),
  };
}

module.exports = {
  API_PORT,
  UI_PORT,
  API_HOST,
  UI_HOST,
  resolveRuntimePaths,
};
