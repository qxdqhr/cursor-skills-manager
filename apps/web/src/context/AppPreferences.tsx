import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import i18n, { type AppLocale } from '../i18n/index.js';
import { applyTheme, type ThemeMode } from '../lib/theme.js';
import { fetchConfig, patchConfig } from '../lib/api.js';
import { getStoredToken } from '../lib/token.js';

type AppPreferencesContextValue = {
  locale: AppLocale;
  theme: ThemeMode;
  setLocale: (locale: AppLocale) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  reloadFromServer: () => Promise<void>;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('zh');
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const reloadFromServer = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const cfg = await fetchConfig();
      if (cfg.locale === 'zh' || cfg.locale === 'en') {
        setLocaleState(cfg.locale);
        await i18n.changeLanguage(cfg.locale);
      }
      if (cfg.theme === 'light' || cfg.theme === 'dark' || cfg.theme === 'system') {
        setThemeState(cfg.theme);
      }
    } catch {
      /* keep local defaults */
    }
  }, []);

  useEffect(() => {
    void reloadFromServer();
  }, [reloadFromServer]);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await i18n.changeLanguage(next);
    if (getStoredToken()) {
      await patchConfig({ locale: next });
    }
  }, []);

  const setTheme = useCallback(async (next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
    if (getStoredToken()) {
      await patchConfig({ theme: next });
    }
  }, []);

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme, reloadFromServer }),
    [locale, theme, setLocale, setTheme, reloadFromServer],
  );

  return (
    <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return ctx;
}
