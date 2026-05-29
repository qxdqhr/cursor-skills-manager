import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { UNCATEGORIZED_CATEGORY_ID } from '../lib/categories.js';
import { cn, ui } from '../lib/ui.js';
import type { SkillTreeNode, SkillsTree } from '../types.js';

export type TreeSelection =
  | { type: 'all' }
  | { type: 'personal'; categoryPath: string }
  | { type: 'project'; workspaceId: string; categoryPath: string };

const TREE_UI_KEY = 'csm.treeUi.v1';

type TreeUiState = {
  personalOpen: boolean;
  projectOpen: Record<string, boolean>;
  collapsedFolders: string[];
};

function loadTreeUi(): TreeUiState {
  const fallback: TreeUiState = {
    personalOpen: true,
    projectOpen: {},
    collapsedFolders: [],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(TREE_UI_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function folderKey(scope: string, path: string): string {
  return `${scope}:${path}`;
}

function nodeLabel(node: SkillTreeNode, t: (key: string) => string): string {
  if (node.id === UNCATEGORIZED_CATEGORY_ID) {
    return t('tree.uncategorized');
  }
  return node.label;
}

function TreeFolderNodes({
  nodes,
  depth,
  prefix,
  scope,
  activePath,
  collapsedFolders,
  onToggleFolder,
  onPick,
}: {
  nodes: SkillTreeNode[];
  depth: number;
  prefix: string;
  scope: string;
  activePath: string | null;
  collapsedFolders: Set<string>;
  onToggleFolder: (key: string) => void;
  onPick: (path: string) => void;
}) {
  const { t } = useTranslation();
  const activeCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  const idleCls = 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800';

  if (nodes.length === 0) {
    return <p className={cn(ui.muted, 'px-2 py-1 text-xs')}>{t('tree.noFolders')}</p>;
  }

  return (
    <ul className={depth > 0 ? cn(ui.border, 'ml-2 border-l pl-1') : ''}>
      {nodes.map((node) => {
        const path = prefix ? `${prefix}/${node.id}` : node.id;
        const key = folderKey(scope, path);
        const hasChildren = node.children.length > 0;
        const collapsed = collapsedFolders.has(key);
        const isActive = activePath === path;

        return (
          <li key={key} className="py-0.5">
            <div className="flex items-stretch gap-0.5">
              {hasChildren ? (
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  aria-label={t('tree.toggleFolder', { name: nodeLabel(node, t) })}
                  onClick={() => onToggleFolder(key)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-transform hover:bg-zinc-200/80 active:scale-[0.96] dark:hover:bg-zinc-800/80"
                >
                  <Chevron className={collapsed ? '' : 'rotate-90'} />
                </button>
              ) : (
                <span className="w-9 shrink-0" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => onPick(path)}
                className={cn(
                  'min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors active:scale-[0.98]',
                  isActive ? activeCls : idleCls,
                )}
              >
                <span className="text-zinc-800 dark:text-zinc-300">{nodeLabel(node, t)}</span>
                <span className={cn(ui.muted, 'ml-1 text-xs tabular-nums')}>({node.skillCount})</span>
              </button>
            </div>
            {hasChildren && !collapsed && (
              <TreeFolderNodes
                nodes={node.children}
                depth={depth + 1}
                prefix={path}
                scope={scope}
                activePath={activePath}
                collapsedFolders={collapsedFolders}
                onToggleFolder={onToggleFolder}
                onPick={onPick}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200/80 bg-zinc-100/40 dark:border-zinc-800/80 dark:bg-zinc-900/20">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-200/60 active:scale-[0.995] dark:hover:bg-zinc-800/60"
      >
        <Chevron className={open ? 'rotate-90' : ''} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            {title}
          </span>
          {subtitle && (
            <span className={cn(ui.muted, 'block truncate text-[11px] normal-case')} title={subtitle}>
              {subtitle}
            </span>
          )}
        </span>
      </button>
      {open && <div className="border-t border-zinc-200/80 px-1 pb-2 pt-1 dark:border-zinc-800/80">{children}</div>}
    </section>
  );
}

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CategoryTree({
  tree,
  selection,
  onSelect,
}: {
  tree: SkillsTree | null;
  selection: TreeSelection;
  onSelect: (s: TreeSelection) => void;
}) {
  const { t } = useTranslation();
  const [uiState, setUiState] = useState<TreeUiState>(loadTreeUi);

  useEffect(() => {
    localStorage.setItem(TREE_UI_KEY, JSON.stringify(uiState));
  }, [uiState]);

  const collapsedFolders = useMemo(() => new Set(uiState.collapsedFolders), [uiState.collapsedFolders]);

  const toggleFolder = useCallback((key: string) => {
    setUiState((prev) => {
      const next = new Set(prev.collapsedFolders);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, collapsedFolders: [...next] };
    });
  }, []);

  const togglePersonal = useCallback(() => {
    setUiState((prev) => ({ ...prev, personalOpen: !prev.personalOpen }));
  }, []);

  const toggleProject = useCallback((workspaceId: string) => {
    setUiState((prev) => ({
      ...prev,
      projectOpen: { ...prev.projectOpen, [workspaceId]: !(prev.projectOpen[workspaceId] ?? true) },
    }));
  }, []);

  if (!tree) {
    return <p className={cn(ui.muted, 'text-sm')}>{t('tree.loading')}</p>;
  }

  const personalActive = selection.type === 'personal' ? selection.categoryPath : null;
  const projectActive =
    selection.type === 'project'
      ? { ws: selection.workspaceId, path: selection.categoryPath }
      : null;

  const activeCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  const idleCls = 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800';

  return (
    <div className="space-y-3 text-sm">
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className={cn(
          'w-full rounded-md px-2 py-1.5 text-left transition-colors active:scale-[0.98]',
          selection.type === 'all' ? activeCls : idleCls,
        )}
      >
        {t('tree.all')}
      </button>

      <CollapsibleSection
        title={t('tree.personal')}
        subtitle={t('tree.personalHint')}
        open={uiState.personalOpen}
        onToggle={togglePersonal}
      >
        <button
          type="button"
          onClick={() => onSelect({ type: 'personal', categoryPath: '' })}
          className={cn(
            'mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-colors active:scale-[0.98]',
            personalActive === '' ? activeCls : idleCls,
          )}
        >
          {t('tree.personalAll')}
        </button>
        <TreeFolderNodes
          nodes={tree.personal}
          depth={0}
          prefix=""
          scope="personal"
          activePath={personalActive}
          collapsedFolders={collapsedFolders}
          onToggleFolder={toggleFolder}
          onPick={(path) => onSelect({ type: 'personal', categoryPath: path })}
        />
      </CollapsibleSection>

      {tree.project.map((ws) => (
        <CollapsibleSection
          key={ws.workspaceId}
          title={t('tree.project')}
          subtitle={ws.workspaceId}
          open={uiState.projectOpen[ws.workspaceId] ?? true}
          onToggle={() => toggleProject(ws.workspaceId)}
        >
          <button
            type="button"
            onClick={() => onSelect({ type: 'project', workspaceId: ws.workspaceId, categoryPath: '' })}
            className={cn(
              'mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-colors active:scale-[0.98]',
              projectActive?.ws === ws.workspaceId && projectActive.path === '' ? activeCls : idleCls,
            )}
          >
            {t('tree.projectAll', { workspace: ws.workspaceId })}
          </button>
          <TreeFolderNodes
            nodes={ws.categories}
            depth={0}
            prefix=""
            scope={`project:${ws.workspaceId}`}
            activePath={projectActive?.ws === ws.workspaceId ? projectActive.path : null}
            collapsedFolders={collapsedFolders}
            onToggleFolder={toggleFolder}
            onPick={(path) =>
              onSelect({ type: 'project', workspaceId: ws.workspaceId, categoryPath: path })
            }
          />
        </CollapsibleSection>
      ))}

      <p className={cn(ui.muted, 'rounded-md bg-zinc-200/50 px-2 py-2 text-[11px] leading-relaxed text-wrap-pretty dark:bg-zinc-800/40')}>
        {t('tree.editHint')}
      </p>
    </div>
  );
}

export function categoryPathLabel(
  sel: Extract<TreeSelection, { type: 'personal' } | { type: 'project' }>,
  t: (key: string, opts?: Record<string, string>) => string,
): string | null {
  if (!sel.categoryPath) return null;
  if (sel.categoryPath === UNCATEGORIZED_CATEGORY_ID) {
    return t('tree.uncategorized');
  }
  if (sel.type === 'project') {
    return `${sel.workspaceId} / ${sel.categoryPath}`;
  }
  return sel.categoryPath;
}
