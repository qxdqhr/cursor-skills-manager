import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, fetchConfig, fetchHealth } from '../lib/api.js';
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/token.js';
import { useAppPreferences } from '../context/AppPreferences.js';
import type { PublicConfig } from '../types.js';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = useAppPreferences();
  const [token, setToken] = useState(getStoredToken() ?? '');
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [health, setHealth] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    fetchHealth()
      .then((h) => setHealth(`API ${h.status} · ${h.personalRoot}`))
      .catch(() => setHealth(t('api.unreachable')));
  }, [t]);

  useEffect(() => {
    if (!getStoredToken()) {
      setConfig(null);
      return;
    }
    fetchConfig()
      .then(setConfig)
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

  return (
    <div className="mx-auto max-w-xl bg-zinc-50 p-6 dark:bg-zinc-950">
      <button type="button" onClick={onBack} className="csm-muted mb-6 text-sm hover:text-zinc-800 dark:hover:text-zinc-200">
        {t('nav.backList')}
      </button>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t('settings.title')}</h1>
      <p className="csm-muted mt-1 text-sm">{health}</p>

      <section className="csm-panel mt-8 space-y-4 p-5">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.locale')}</h2>
        <select
          value={locale}
          onChange={(e) => void setLocale(e.target.value as 'zh' | 'en')}
          className="csm-input w-full rounded-lg px-3 py-2 text-sm"
        >
          <option value="zh">{t('locale.zh')}</option>
          <option value="en">{t('locale.en')}</option>
        </select>
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.theme')}</h2>
        <select
          value={theme}
          onChange={(e) => void setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="csm-input w-full rounded-lg px-3 py-2 text-sm"
        >
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
          <option value="system">{t('theme.system')}</option>
        </select>
      </section>

      <section className="csm-panel mt-6 space-y-4 p-5">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-300">{t('settings.apiToken')}</h2>
        <p className="csm-muted text-xs">{t('settings.tokenHint')}</p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
          className="csm-input w-full rounded-lg px-3 py-2 font-mono text-sm"
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleSaveToken} className="csm-btn-primary">
            {t('settings.saveToken')}
          </button>
          <button
            type="button"
            onClick={() => {
              clearStoredToken();
              setToken('');
            }}
            className="csm-btn"
          >
            {t('settings.clear')}
          </button>
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </section>

      {config && (
        <section className="csm-panel mt-6 space-y-3 p-5 text-sm">
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
      <span className="csm-muted w-24 shrink-0">{label}</span>
      <span className={mono ? 'break-all font-mono text-xs text-zinc-600 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-300'}>
        {value}
      </span>
    </div>
  );
}
