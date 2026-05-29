import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, fetchConfig, fetchHealth, fetchPlatforms, patchConfig } from '../lib/api.js';
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/token.js';
import { useAppPreferences } from '../context/AppPreferences.js';
import { cn, ui } from '../lib/ui.js';
import type { PlatformDefinition, PlatformId, PublicConfig } from '../types.js';

const PLATFORM_I18N: Record<PlatformId, string> = {
  cursor: 'platforms.cursor',
  agents: 'platforms.agents',
  opencode: 'platforms.opencode',
  claude: 'platforms.claude',
  codex: 'platforms.codex',
};

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = useAppPreferences();
  const [token, setToken] = useState(getStoredToken() ?? '');
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [platforms, setPlatforms] = useState<PlatformDefinition[]>([]);
  const [health, setHealth] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [platformSaving, setPlatformSaving] = useState<PlatformId | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    fetchHealth()
      .then((h) => setHealth(`API ${h.status} · ${h.personalRoot}`))
      .catch(() => setHealth(t('api.unreachable')));
  }, [t]);

  useEffect(() => {
    if (!getStoredToken()) {
      setConfig(null);
      setPlatforms([]);
      return;
    }
    Promise.all([fetchConfig(), fetchPlatforms()])
      .then(([cfg, plats]) => {
        setConfig(cfg);
        setPlatforms(plats.items);
      })
      .catch((e: unknown) => {
        if (e instanceof ApiClientError && e.status === 401) {
          setError(t('settings.invalidToken'));
        }
      });
  }, [configVersion, t]);

  function handleSaveToken() {
    setStoredToken(token);
    setConfigVersion((v) => v + 1);
    setError(null);
  }

  async function togglePlatform(platform: PlatformDefinition) {
    if (platform.id === 'cursor') return;
    setPlatformSaving(platform.id);
    setError(null);
    try {
      const nextEnabled = platform.enabled
        ? (config?.platforms?.enabled ?? platforms.filter((p) => p.enabled).map((p) => p.id)).filter(
            (id) => id !== platform.id,
          )
        : [
            ...new Set([
              ...(config?.platforms?.enabled ?? platforms.filter((p) => p.enabled).map((p) => p.id)),
              platform.id,
            ]),
          ];
      const next = await patchConfig({
        platforms: {
          enabled: nextEnabled,
          definitions: {
            [platform.id]: { enabled: !platform.enabled },
          },
        },
      });
      setConfig(next);
      const plats = await fetchPlatforms();
      setPlatforms(plats.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('common.loadFailed'));
    } finally {
      setPlatformSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl bg-zinc-50 p-6 dark:bg-zinc-950">
      <button type="button" onClick={onBack} className={cn(ui.muted, 'mb-6 text-sm hover:text-zinc-800 dark:hover:text-zinc-200')}>
        {t('nav.backList')}
      </button>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t('settings.title')}</h1>
      <p className={cn(ui.muted, 'mt-1 text-sm')}>{health}</p>

      <section className={cn(ui.panel, 'mt-8 space-y-4 p-5')}>
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.locale')}</h2>
        <select
          value={locale}
          onChange={(e) => void setLocale(e.target.value as 'zh' | 'en')}
          className={cn(ui.input, 'w-full rounded-lg px-3 py-2 text-sm')}
        >
          <option value="zh">{t('locale.zh')}</option>
          <option value="en">{t('locale.en')}</option>
        </select>
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.theme')}</h2>
        <select
          value={theme}
          onChange={(e) => void setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className={cn(ui.input, 'w-full rounded-lg px-3 py-2 text-sm')}
        >
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
          <option value="system">{t('theme.system')}</option>
        </select>
      </section>

      <section className={cn(ui.panel, 'mt-6 space-y-4 p-5')}>
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.apiToken')}</h2>
        <p className={cn(ui.muted, 'text-xs')}>{t('settings.tokenHint')}</p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
          className={cn(ui.input, 'w-full rounded-lg px-3 py-2 font-mono text-sm')}
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleSaveToken} className={ui.btnPrimary}>
            {t('settings.saveToken')}
          </button>
          <button
            type="button"
            onClick={() => {
              clearStoredToken();
              setToken('');
            }}
            className={ui.btn}
          >
            {t('settings.clear')}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </section>

      {platforms.length > 0 && (
        <section className={cn(ui.panel, 'mt-6 space-y-4 p-5')}>
          <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.platforms')}</h2>
          <p className={cn(ui.muted, 'text-xs')}>{t('settings.platformsHint')}</p>
          <ul className="space-y-3">
            {platforms.map((platform) => (
              <li
                key={platform.id}
                className="rounded-lg border border-zinc-200/80 px-3 py-3 dark:border-zinc-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {t(PLATFORM_I18N[platform.id])}
                    </p>
                    <p className={cn(ui.muted, 'mt-1 break-all font-mono text-[11px]')}>
                      {t('settings.platformRoot')}: {platform.globalRoot}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={platform.enabled}
                      disabled={platform.id === 'cursor' || platformSaving === platform.id}
                      onChange={() => void togglePlatform(platform)}
                    />
                    {t('settings.platformEnabled')}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {config && (
        <section className={cn(ui.panel, 'mt-6 space-y-3 p-5 text-sm')}>
          <h2 className="font-medium text-zinc-800 dark:text-zinc-300">{t('settings.configReadonly')}</h2>
          <Row label={t('settings.personalRoot')} value={config.paths.personalRoot} mono />
          <Row label={t('settings.agents')} value={config.paths.agentsRoot ?? '—'} mono />
          <Row label={t('settings.scanGlobs')} value={config.paths.projectScanGlobs?.join(', ') ?? '—'} />
          <Row label={t('settings.apiPort')} value={String(config.api.port)} />
          <Row
            label={t('settings.serverToken')}
            value={config.api.hasToken ? t('settings.tokenConfigured') : t('settings.tokenMissing')}
          />
        </section>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className={cn(ui.muted, 'w-24 shrink-0')}>{label}</span>
      <span className={mono ? 'break-all font-mono text-xs text-zinc-600 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-300'}>
        {value}
      </span>
    </div>
  );
}
