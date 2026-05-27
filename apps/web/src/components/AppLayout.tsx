import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderPreferences } from './HeaderPreferences.js';

export function AppLayout({
  toolbar,
  sidebar,
  children,
  detail,
  gitPanel,
  onOpenSettings,
  headerActions,
}: {
  toolbar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  gitPanel?: ReactNode;
  onOpenSettings: () => void;
  headerActions?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="csm-shell">
      <header className="csm-header">
        <div className="shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">{t('app.title')}</h1>
          <p className="csm-muted text-xs">{t('app.subtitle')}</p>
        </div>
        {toolbar}
        <HeaderPreferences />
        {headerActions}
        <button type="button" onClick={onOpenSettings} className="csm-btn shrink-0">
          {t('nav.settings')}
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="csm-aside">{sidebar}</aside>
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        {detail && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            {detail}
          </aside>
        )}
        {gitPanel}
      </div>
    </div>
  );
}
