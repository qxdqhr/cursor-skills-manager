import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderPreferences } from './HeaderPreferences.js';
import { ResizablePanel } from './ResizablePanel.js';
import { usePanelLayout } from '../hooks/usePanelLayout.js';
import { cn, ui } from '../lib/ui.js';

export function AppLayout({
  toolbar,
  browse,
  listHeader,
  children,
  detail,
  gitPanel,
  onOpenSettings,
  headerActions,
}: {
  toolbar: ReactNode;
  browse: ReactNode;
  listHeader?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  gitPanel?: ReactNode;
  onOpenSettings: () => void;
  headerActions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { panels, setWidth, adjustWidth, toggleCollapsed, panelWidth } = usePanelLayout();

  const resizeDetailFromList = useCallback(
    (delta: number) => {
      adjustWidth('detail', -delta);
      adjustWidth('list', delta);
    },
    [adjustWidth],
  );

  const resizeListFromBrowse = useCallback(
    (delta: number) => {
      adjustWidth('browse', delta);
      adjustWidth('list', -delta);
    },
    [adjustWidth],
  );

  return (
    <div className={ui.shell}>
      <header className={ui.header}>
        <div className="shrink-0">
          <h1 className="text-lg font-semibold tracking-tight text-wrap-balance">{t('app.title')}</h1>
          <p className={cn(ui.muted, 'text-xs text-wrap-pretty')}>{t('app.subtitle')}</p>
        </div>
        {toolbar}
        <HeaderPreferences />
        {headerActions}
        <button
          type="button"
          onClick={onOpenSettings}
          className={cn(ui.btn, 'shrink-0 transition-transform active:scale-[0.96]')}
        >
          {t('nav.settings')}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ResizablePanel
          panelId="browse"
          title={t('layout.browse')}
          collapsed={panels.browse.collapsed}
          width={panelWidth('browse')}
          onWidthChange={(w) => setWidth('browse', w)}
          onToggleCollapsed={() => toggleCollapsed('browse')}
          resizeFrom="right"
          collapsedLabel={t('layout.browseShort')}
        >
          {browse}
        </ResizablePanel>

        <ResizablePanel
          panelId="list"
          title={t('layout.list')}
          collapsed={panels.list.collapsed}
          width={panelWidth('list')}
          onWidthChange={(w) => setWidth('list', w)}
          onToggleCollapsed={() => toggleCollapsed('list')}
          resizeFrom="right"
          flexible
          onResizeLeftEdge={resizeListFromBrowse}
          onResizeRightEdge={resizeDetailFromList}
          collapsedLabel={t('layout.listShort')}
        >
          <div className="flex h-full flex-col">
            {listHeader}
            {children}
          </div>
        </ResizablePanel>

        {detail && (
          <ResizablePanel
            panelId="detail"
            title={t('layout.detail')}
            collapsed={panels.detail.collapsed}
            width={panelWidth('detail')}
            onWidthChange={(w) => setWidth('detail', w)}
            onToggleCollapsed={() => toggleCollapsed('detail')}
            resizeFrom="left"
            collapsedLabel={t('layout.detailShort')}
          >
            {detail}
          </ResizablePanel>
        )}

        {gitPanel}
      </div>
    </div>
  );
}
