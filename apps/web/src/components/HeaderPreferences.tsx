import { useTranslation } from 'react-i18next';
import { useAppPreferences } from '../context/AppPreferences.js';
import { cn, ui } from '../lib/ui.js';
import type { AppLocale } from '../i18n/index.js';
import type { ThemeMode } from '../lib/theme.js';

export function HeaderPreferences() {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = useAppPreferences();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <select
        value={locale}
        onChange={(e) => void setLocale(e.target.value as AppLocale)}
        className={cn(ui.input, 'rounded-lg px-2 py-1.5 text-sm')}
        aria-label={t('settings.locale')}
      >
        <option value="zh">{t('locale.zh')}</option>
        <option value="en">{t('locale.en')}</option>
      </select>
      <select
        value={theme}
        onChange={(e) => void setTheme(e.target.value as ThemeMode)}
        className={cn(ui.input, 'rounded-lg px-2 py-1.5 text-sm')}
        aria-label={t('settings.theme')}
      >
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
        <option value="system">{t('theme.system')}</option>
      </select>
    </div>
  );
}
