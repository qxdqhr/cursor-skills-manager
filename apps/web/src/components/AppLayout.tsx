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
  onOpenSettings,
  headerActions,
}: {
  toolbar: ReactNode;
  browse: ReactNode;
  listHeader?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  onOpenSettings: () => void;
  headerActions?: ReactNode;
}) {
  const { t } = useTranslation();
  const { panels, setWidth, adjustWidth, toggleCollapsed, panelWidth, canCollapsePanel } = usePanelLayout();
  const maxCollapsedHint = t('layout.maxCollapsed');

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

      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <ResizablePanel
          panelId="browse"
          title={t('layout.browse')}
          collapsed={panels.browse.collapsed}
          width={panelWidth('browse')}
          onWidthChange={(w) => setWidth('browse', w)}
          onToggleCollapsed={() => toggleCollapsed('browse')}
          collapseDisabled={!canCollapsePanel('browse')}
          collapseDisabledHint={maxCollapsedHint}
          resizeFrom="right"
          suppressResizeRight={!panels.list.collapsed}
          onResizeRightEdge={
            !panels.browse.collapsed && panels.list.collapsed
              ? (delta) => adjustWidth('browse', delta)
              : undefined
          }
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
          collapseDisabled={!canCollapsePanel('list')}
          collapseDisabledHint={maxCollapsedHint}
          resizeFrom="right"
          onResizeLeftEdge={!panels.list.collapsed ? resizeListFromBrowse : undefined}
          onResizeRightEdge={
            !panels.list.collapsed && !panels.detail.collapsed
              ? resizeDetailFromList
              : undefined
          }
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
            collapseDisabled={!canCollapsePanel('detail')}
            collapseDisabledHint={maxCollapsedHint}
            resizeFrom="left"
            onResizeLeftEdge={
              !panels.detail.collapsed && !panels.list.collapsed
                ? (delta) => {
                    adjustWidth('list', delta);
                    adjustWidth('detail', -delta);
                  }
                : !panels.detail.collapsed && panels.list.collapsed && !panels.browse.collapsed
                  ? (delta) => {
                      adjustWidth('browse', delta);
                      adjustWidth('detail', -delta);
                    }
                  : undefined
            }
            collapsedLabel={t('layout.detailShort')}
          >
            {detail}
          </ResizablePanel>
        )}

      </div>
    </div>
  );
}
