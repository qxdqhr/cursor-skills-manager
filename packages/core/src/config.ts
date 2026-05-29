import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { defaultAgentsRoot, defaultPersonalRoot, expandHome } from './paths.js';
import { defaultPlatformsConfig, migratePlatformsFromV1 } from './platforms/registry.js';

import type { PlatformsConfig } from './platforms/types.js';

export type CsmLocale = 'zh' | 'en';
export type CsmTheme = 'light' | 'dark' | 'system';

export interface CsmConfig {
  version: number;
  locale: CsmLocale;
  theme?: CsmTheme;
  api: {
    port: number;
    token?: string;
  };
  paths: {
    personalRoot: string;
    agentsRoot?: string;
    projectScanGlobs?: string[];
    editor?: string;
    /** e.g. `dolphin` or `gio open` — overrides CSM_FILE_MANAGER */
    fileManager?: string;
  };
  platforms?: PlatformsConfig;
  reservedDirNames?: string[];
}

const CONFIG_VERSION = 2;

export function csmDir(personalRoot: string): string {
  return join(personalRoot, '.csm');
}

export function configPath(personalRoot: string): string {
  return join(csmDir(personalRoot), 'config.json');
}

export function indexDbPath(personalRoot: string): string {
  return join(csmDir(personalRoot), 'index.sqlite');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function defaultConfig(overrides?: Partial<CsmConfig>): CsmConfig {
  const personalRoot = expandHome(
    overrides?.paths?.personalRoot ?? defaultPersonalRoot(),
  );
  return {
    version: CONFIG_VERSION,
    locale: 'zh',
    theme: 'system',
    api: {
      port: Number(process.env.CSM_API_PORT ?? '3847'),
      token: undefined,
      ...overrides?.api,
    },
    paths: {
      personalRoot,
      agentsRoot: expandHome(defaultAgentsRoot()),
      projectScanGlobs: ['~/project/**/.cursor/skills'],
      ...overrides?.paths,
    },
    reservedDirNames: ['scripts', '.git', '.csm'],
    platforms: defaultPlatformsConfig(personalRoot),
    ...overrides,
  };
}

function normalizeConfig(parsed: CsmConfig, personalRoot: string): CsmConfig {
  const base = defaultConfig({ paths: { personalRoot } });
  const merged: CsmConfig = {
    ...base,
    ...parsed,
    paths: {
      ...base.paths,
      ...parsed.paths,
      personalRoot: expandHome(parsed.paths?.personalRoot ?? personalRoot),
    },
    api: {
      ...base.api,
      ...parsed.api,
    },
  };
  if (!merged.platforms) {
    merged.platforms = migratePlatformsFromV1(merged);
  }
  if ((parsed.version ?? 1) < CONFIG_VERSION) {
    merged.version = CONFIG_VERSION;
  }
  return merged;
}

export async function loadConfig(personalRootInput?: string): Promise<CsmConfig> {
  const root = expandHome(personalRootInput ?? defaultPersonalRoot());
  const path = configPath(root);
  if (!existsSync(path)) {
    return ensureConfig(root);
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as CsmConfig;
  return normalizeConfig(parsed, root);
}

/** 确保 .csm 目录与 config.json 存在，并生成 api.token */
export async function ensureConfig(personalRootInput?: string): Promise<CsmConfig> {
  const root = expandHome(personalRootInput ?? defaultPersonalRoot());
  const dir = csmDir(root);
  await mkdir(dir, { recursive: true });
  const path = configPath(root);
  if (existsSync(path)) {
    const cfg = await loadConfig(root);
    if (!cfg.api.token) {
      cfg.api.token = generateToken();
      await saveConfig(root, { api: { ...cfg.api, token: cfg.api.token } });
    }
    return loadConfig(root);
  }
  const cfg = defaultConfig({
    paths: { personalRoot: root },
    api: { port: Number(process.env.CSM_API_PORT ?? '3847'), token: generateToken() },
  });
  await writeFile(path, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8');
  return cfg;
}

export type CsmConfigPatch = Partial<Omit<CsmConfig, 'api' | 'paths'>> & {
  api?: Partial<CsmConfig['api']>;
  paths?: Partial<CsmConfig['paths']>;
};

export async function saveConfig(
  personalRootInput: string,
  patch: CsmConfigPatch,
): Promise<CsmConfig> {
  const root = expandHome(personalRootInput);
  const current = await loadConfig(root);
  const next: CsmConfig = {
    ...current,
    ...patch,
    api: { ...current.api, ...patch.api },
    paths: { ...current.paths, ...patch.paths },
    platforms: patch.platforms
      ? {
          enabled: patch.platforms.enabled ?? current.platforms?.enabled ?? [],
          definitions: {
            ...current.platforms?.definitions,
            ...patch.platforms.definitions,
          },
        }
      : current.platforms,
  };
  await mkdir(csmDir(root), { recursive: true });
  await writeFile(configPath(root), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export type PublicCsmConfig = Omit<CsmConfig, 'api'> & {
  api: Omit<CsmConfig['api'], 'token'> & { hasToken: boolean };
};

/** 对外暴露的配置（隐藏 token 明文） */
export function publicConfig(cfg: CsmConfig): PublicCsmConfig {
  const { token: _token, ...apiRest } = cfg.api;
  return {
    ...cfg,
    api: {
      ...apiRest,
      hasToken: Boolean(cfg.api.token),
    },
  };
}

export function getApiToken(cfg: CsmConfig): string | undefined {
  return cfg.api.token;
}
