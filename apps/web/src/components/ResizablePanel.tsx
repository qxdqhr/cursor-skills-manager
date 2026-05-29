import { useCallback, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PanelId } from '../hooks/usePanelLayout.js';
import { PANEL_LIMITS } from '../hooks/usePanelLayout.js';

export function ResizablePanel({
  panelId,
  title,
  collapsed,
  width,
  onWidthChange,
  onToggleCollapsed,
  resizeFrom,
  flexible,
  onResizeLeftEdge,
  onResizeRightEdge,
  children,
  collapsedLabel,
}: {
  panelId: PanelId;
  title: string;
  collapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggleCollapsed: () => void;
  /** Which edge the drag handle sits on */
  resizeFrom: 'left' | 'right';
  /** Center column grows to fill remaining space */
  flexible?: boolean;
  onResizeLeftEdge?: (delta: number) => void;
  onResizeRightEdge?: (delta: number) => void;
  children: ReactNode;
  collapsedLabel?: string;
}) {
  const { t } = useTranslation();
  const dragging = useRef(false);

  const startDrag = useCallback(
    (clientX: number, onDelta: (delta: number) => void) => {
      if (collapsed) return;
      dragging.current = true;
      let lastX = clientX;

      const onMove = (e: PointerEvent) => {
        if (!dragging.current) return;
        const delta = e.clientX - lastX;
        lastX = e.clientX;
        if (delta !== 0) onDelta(delta);
      };

      const onUp = () => {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [collapsed],
  );

  const onResizeStart = useCallback(
    (clientX: number) => {
      const { min, max } = PANEL_LIMITS[panelId];
      const sign = resizeFrom === 'right' ? 1 : -1;
      let current = width;
      startDrag(clientX, (delta) => {
        current = Math.min(max, Math.max(min, current + delta * sign));
        onWidthChange(current);
      });
    },
    [onWidthChange, panelId, resizeFrom, startDrag, width],
  );

  const onFlexibleLeftResize = useCallback(
    (clientX: number) => {
      if (!onResizeLeftEdge) return;
      startDrag(clientX, (delta) => {
        onResizeLeftEdge(delta);
      });
    },
    [onResizeLeftEdge, startDrag],
  );

  const onFlexibleRightResize = useCallback(
    (clientX: number) => {
      if (!onResizeRightEdge) return;
      startDrag(clientX, (delta) => {
        onResizeRightEdge(delta);
      });
    },
    [onResizeRightEdge, startDrag],
  );

  const style = flexible
    ? ({
        flex: collapsed ? '0 0 auto' : '1 1 0%',
        width: collapsed ? PANEL_LIMITS[panelId].collapsedWidth : undefined,
        minWidth: collapsed ? undefined : width,
      } as const)
    : ({
        flex: '0 0 auto',
        width: collapsed ? PANEL_LIMITS[panelId].collapsedWidth : width,
      } as const);

  return (
    <div
      className="relative flex min-h-0 flex-col bg-zinc-50 dark:bg-zinc-950"
      style={style}
      data-panel={panelId}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200/80 px-2 py-1.5 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:border-zinc-800/80 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('layout.expandPanel', { panel: title }) : t('layout.collapsePanel', { panel: title })}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-transform hover:bg-zinc-200/80 hover:text-zinc-800 active:scale-[0.96] dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200"
        >
          <ChevronIcon collapsed={collapsed} side={resizeFrom === 'right' ? 'left' : 'right'} />
        </button>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700 text-wrap-balance dark:text-zinc-300">
            {title}
          </span>
        )}
      </div>

      {collapsed ? (
        <div className="flex flex-1 items-start justify-center pt-3">
          <span
            className="text-[11px] font-medium tracking-wide text-zinc-500 [writing-mode:vertical-rl] dark:text-zinc-500"
            aria-hidden
          >
            {collapsedLabel ?? title}
          </span>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      )}

      {!collapsed && !flexible && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('layout.resizePanel', { panel: title })}
          onPointerDown={(e) => {
            e.preventDefault();
            onResizeStart(e.clientX);
          }}
          className={`absolute top-0 z-10 h-full w-1.5 cursor-col-resize touch-none ${
            resizeFrom === 'right' ? '-right-0.5' : '-left-0.5'
          }`}
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300/0 transition-colors hover:bg-zinc-400/70 dark:hover:bg-zinc-600/70" />
        </div>
      )}

      {!collapsed && flexible && onResizeLeftEdge && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('layout.resizePanel', { panel: title })}
          onPointerDown={(e) => {
            e.preventDefault();
            onFlexibleLeftResize(e.clientX);
          }}
          className="absolute -left-0.5 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300/0 transition-colors hover:bg-zinc-400/70 dark:hover:bg-zinc-600/70" />
        </div>
      )}

      {!collapsed && flexible && onResizeRightEdge && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('layout.resizePanel', { panel: title })}
          onPointerDown={(e) => {
            e.preventDefault();
            onFlexibleRightResize(e.clientX);
          }}
          className="absolute -right-0.5 top-0 z-10 h-full w-1.5 cursor-col-resize touch-none"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-300/0 transition-colors hover:bg-zinc-400/70 dark:hover:bg-zinc-600/70" />
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ collapsed, side }: { collapsed: boolean; side: 'left' | 'right' }) {
  const pointsLeft = side === 'left' ? !collapsed : collapsed;
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 transition-transform duration-200 ${pointsLeft ? '' : 'rotate-180'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
