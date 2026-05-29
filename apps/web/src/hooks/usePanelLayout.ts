import { useCallback, useEffect, useState } from 'react';

export type PanelId = 'browse' | 'list' | 'detail';

export type PanelConfig = {
  width: number;
  collapsed: boolean;
  /** width before collapse, restored on expand */
  lastWidth: number;
};

export type PanelLayoutState = Record<PanelId, PanelConfig>;

const STORAGE_KEY = 'csm.panelLayout.v1';

const DEFAULTS: PanelLayoutState = {
  browse: { width: 240, collapsed: false, lastWidth: 240 },
  list: { width: 420, collapsed: false, lastWidth: 420 },
  detail: { width: 320, collapsed: false, lastWidth: 320 },
};

export const PANEL_LIMITS: Record<
  PanelId,
  { min: number; max: number; collapsedWidth: number }
> = {
  browse: { min: 180, max: 400, collapsedWidth: 44 },
  list: { min: 280, max: 960, collapsedWidth: 44 },
  detail: { min: 240, max: 560, collapsedWidth: 44 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadState(): PanelLayoutState {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PanelLayoutState>;
    return (['browse', 'list', 'detail'] as PanelId[]).reduce((acc, id) => {
      const fallback = DEFAULTS[id];
      const saved = parsed[id];
      acc[id] = {
        width: clamp(saved?.width ?? fallback.width, PANEL_LIMITS[id].min, PANEL_LIMITS[id].max),
        collapsed: saved?.collapsed ?? fallback.collapsed,
        lastWidth: clamp(
          saved?.lastWidth ?? saved?.width ?? fallback.lastWidth,
          PANEL_LIMITS[id].min,
          PANEL_LIMITS[id].max,
        ),
      };
      return acc;
    }, {} as PanelLayoutState);
  } catch {
    return DEFAULTS;
  }
}

export function usePanelLayout() {
  const [panels, setPanels] = useState<PanelLayoutState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  }, [panels]);

  const setWidth = useCallback((id: PanelId, width: number) => {
    const { min, max } = PANEL_LIMITS[id];
    setPanels((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        width: clamp(width, min, max),
        lastWidth: clamp(width, min, max),
      },
    }));
  }, []);

  const toggleCollapsed = useCallback((id: PanelId) => {
    setPanels((prev) => {
      const panel = prev[id];
      if (panel.collapsed) {
        return {
          ...prev,
          [id]: {
            ...panel,
            collapsed: false,
            width: panel.lastWidth,
          },
        };
      }
      return {
        ...prev,
        [id]: {
          ...panel,
          collapsed: true,
          lastWidth: panel.width,
        },
      };
    });
  }, []);

  const adjustWidth = useCallback((id: PanelId, delta: number) => {
    const { min, max } = PANEL_LIMITS[id];
    setPanels((prev) => {
      const next = clamp(prev[id].width + delta, min, max);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          width: next,
          lastWidth: next,
        },
      };
    });
  }, []);

  const panelWidth = useCallback(
    (id: PanelId) => {
      const panel = panels[id];
      return panel.collapsed ? PANEL_LIMITS[id].collapsedWidth : panel.width;
    },
    [panels],
  );

  return { panels, setWidth, adjustWidth, toggleCollapsed, panelWidth };
}
