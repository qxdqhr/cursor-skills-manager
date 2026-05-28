const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const {
  API_HOST,
  API_PORT,
  UI_HOST,
  UI_PORT,
  resolveRuntimePaths,
} = require('./paths.js');
const { waitForHealth } = require('./health.js');
const { startStaticServer } = require('./static-server.js');
const { startBundledApi, startDevApi, stopChild } = require('./sidecar.js');

/** @type {import('node:child_process').ChildProcess | null} */
let apiProcess = null;
/** @type {{ close: () => Promise<void> } | null} */
let uiServer = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow(loadUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Cursor Skills Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(loadUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function ensureApiSidecar(runtime) {
  try {
    await waitForHealth(runtime.apiHealthUrl, 2_000);
    return null;
  } catch {
    // continue to spawn
  }

  if (runtime.mode === 'bundled') {
    return startBundledApi(runtime.apiDir, runtime.apiEntry);
  }

  return startDevApi(runtime.monorepoRoot);
}

async function bootstrap() {
  const runtime = resolveRuntimePaths(app.isPackaged);
  let loadUrl = runtime.uiUrl;

  apiProcess = await ensureApiSidecar(runtime);
  await waitForHealth(runtime.apiHealthUrl, 90_000);

  if (runtime.mode === 'bundled') {
    uiServer = await startStaticServer({
      webRoot: runtime.webDir,
      apiOrigin: `http://${API_HOST}:${API_PORT}`,
      host: UI_HOST,
      port: 0,
    });
    loadUrl = uiServer.url;
  } else {
    await waitForHealth(runtime.uiUrl, 90_000);
  }

  createWindow(loadUrl);
}

async function shutdown() {
  if (uiServer) {
    try {
      await uiServer.close();
    } catch (error) {
      console.error('[csm/desktop] static server close failed', error);
    }
    uiServer = null;
  }

  stopChild(apiProcess);
  apiProcess = null;
}

app.whenReady().then(async () => {
  try {
    await bootstrap();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[csm/desktop] startup failed:', message);
    await dialog.showErrorBox(
      'Cursor Skills Manager 启动失败',
      `${message}\n\n开发模式请先运行: pnpm dev:desktop\n或分别启动 pnpm dev:api 与 pnpm dev:web`,
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    bootstrap().catch((error) => {
      console.error('[csm/desktop] re-activate failed', error);
    });
  }
});

app.on('before-quit', () => {
  shutdown();
});

process.on('SIGINT', () => {
  shutdown().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  shutdown().finally(() => process.exit(0));
});
