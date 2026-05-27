import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { defaultAgentsRoot, defaultPersonalRoot, expandHome } from './paths.js';

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
  };
  reservedDirNames?: string[];
}

const CONFIG_VERSION = 1;

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
    ...overrides,
  };
}

export async function loadConfig(personalRootInput?: string): Promise<CsmConfig> {
  const root = expandHome(personalRootInput ?? defaultPersonalRoot());
  const path = configPath(root);
  if (!existsSync(path)) {
    return ensureConfig(root);
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as CsmConfig;
  return {
    ...defaultConfig({ paths: { personalRoot: root } }),
    ...parsed,
    paths: {
      ...defaultConfig({ paths: { personalRoot: root } }).paths,
      ...parsed.paths,
      personalRoot: expandHome(parsed.paths?.personalRoot ?? root),
    },
    api: {
      ...defaultConfig().api,
      ...parsed.api,
    },
  };
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
