import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppPreferences } from '../context/AppPreferences.js';
import { AppLayout } from '../components/AppLayout.js';
import {
  BrowsePanel,
  countActiveQuickFilters,
  EMPTY_QUICK_FILTERS,
  sourceFromTree,
  type SkillQuickFilters,
} from '../components/BrowsePanel.js';
import type { TreeSelection } from '../components/CategoryTree.js';
import { categoryPathLabel } from '../components/CategoryTree.js';
import { SearchBar } from '../components/SearchBar.js';
import { SkillDetailPanel } from '../components/SkillDetailPanel.js';
import { SkillList } from '../components/SkillList.js';
import { Toast } from '../components/Toast.js';
import { NewSkillDialog } from '../components/NewSkillDialog.js';
import { GitPanel } from '../components/GitPanel.js';
import { SyncAgentsModal } from '../components/SyncAgentsModal.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { ApiClientError, fetchSkills, fetchSkillsTree } from '../lib/api.js';
import { getStoredToken } from '../lib/token.js';
import { cn, ui } from '../lib/ui.js';
import { normalizeSkillsTree } from '../lib/categories.js';
import type { SkillSummary, SkillsTree } from '../types.js';
import { matchesCategoryPath } from '../types.js';

function matchesTree(skill: SkillSummary, sel: TreeSelection): boolean {
  if (sel.type === 'all') return true;
  if (sel.type === 'project') {
    const prefix = `project:${sel.workspaceId}:`;
    if (!skill.skillId.startsWith(prefix)) return false;
    return matchesCategoryPath(skill, sel.categoryPath);
  }
  if (skill.source !== 'personal') return false;
  return matchesCategoryPath(skill, sel.categoryPath);
}

function matchesQuickFilters(skill: SkillSummary, filters: SkillQuickFilters): boolean {
  if (filters.invalidOnly && skill.validation.ok) return false;
  if (filters.scriptsOnly && !skill.hasScripts) return false;
  if (filters.agentsIssueOnly && !(skill.agentsLink && !skill.agentsLink.ok)) return false;
  return true;
}

function treeFilterLabel(sel: TreeSelection, t: (key: string, opts?: Record<string, string>) => string): string | null {
  if (sel.type === 'all') return null;
  if (sel.type === 'personal') {
    if (!sel.categoryPath) return t('tree.personalAll');
    return categoryPathLabel(sel, t);
  }
  if (!sel.categoryPath) return t('tree.projectAll', { workspace: sel.workspaceId });
  return categoryPathLabel(sel, t);
}

export function SkillsPage({
  onOpenSettings,
  onEditSkill,
}: {
  onOpenSettings: () => void;
  onEditSkill: (skillId: string) => void;
}) {
  const { t } = useTranslation();
  const { locale } = useAppPreferences();
  const [query, setQuery] = useState('');
  const [quickFilters, setQuickFilters] = useState<SkillQuickFilters>(EMPTY_QUICK_FILTERS);
  const [gitOpen, setGitOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [treeSelection, setTreeSelection] = useState<TreeSelection>({ type: 'all' });
  const [tree, setTree] = useState<SkillsTree | null>(null);
  const [items, setItems] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SkillSummary | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const source = sourceFromTree(treeSelection);

  const load = useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      setToast(t('settings.firstUseToken'));
      return;
    }
    setLoading(true);
    try {
      const sourceParam = source === 'all' ? undefined : source;
      const { items: list } = await fetchSkills({
        q: debouncedQuery || undefined,
        source: sourceParam,
        gitDirty: quickFilters.gitDirtyOnly || undefined,
      });
      setItems(list);
    } catch (e) {
      const msg =
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : t('common.loadFailed');
      setToast(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, source, quickFilters.gitDirtyOnly, t]);

  useEffect(() => {
    if (!getStoredToken()) return;
    fetchSkillsTree()
      .then((data) => setTree(normalizeSkillsTree(data)))
      .catch(() => setTree({ personal: [], project: [] }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items
      .filter((s) => matchesTree(s, treeSelection))
      .filter((s) => matchesQuickFilters(s, quickFilters));
  }, [items, treeSelection, quickFilters]);

  useEffect(() => {
    if (loading) return;
    setSelected((prev) => {
      if (filtered.length === 0) return null;
      if (prev && filtered.some((s) => s.skillId === prev.skillId)) return prev;
      return filtered[0] ?? null;
    });
  }, [filtered, loading]);

  const treeLabel = treeFilterLabel(treeSelection, t);
  const quickFilterCount = countActiveQuickFilters(quickFilters);

  return (
    <>
      <AppLayout
        onOpenSettings={onOpenSettings}
        headerActions={
          <>
            <button
              type="button"
              onClick={() => setSyncOpen(true)}
              className={cn(ui.btn, 'transition-transform active:scale-[0.96]')}
            >
              {t('nav.syncAgents')}
            </button>
            <button
              type="button"
              onClick={() => setGitOpen(true)}
              className={cn(ui.btn, 'transition-transform active:scale-[0.96]')}
            >
              {t('nav.git')}
            </button>
          </>
        }
        toolbar={<SearchBar query={query} onQueryChange={setQuery} />}
        browse={
          <BrowsePanel
            tree={tree}
            treeSelection={treeSelection}
            onTreeSelect={setTreeSelection}
            filters={quickFilters}
            onFiltersChange={setQuickFilters}
          />
        }
        listHeader={
          <div className="border-b border-zinc-200/80 px-3 py-2 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:border-zinc-800/80 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={cn(ui.muted, 'tabular-nums')}>
                {loading
                  ? t('skills.loading')
                  : t('skills.count', { filtered: filtered.length, total: items.length })}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="text-emerald-600 transition-transform hover:text-emerald-500 active:scale-[0.96] dark:text-emerald-500 dark:hover:text-emerald-400"
                >
                  {t('nav.new')}
                </button>
                <button
                  type="button"
                  onClick={() => load()}
                  className="text-emerald-600 transition-transform hover:text-emerald-500 active:scale-[0.96] dark:text-emerald-500 dark:hover:text-emerald-400"
                >
                  {t('nav.refresh')}
                </button>
              </div>
            </div>
            {(treeLabel || quickFilterCount > 0 || debouncedQuery) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {debouncedQuery && (
                  <FilterChip
                    label={t('filters.searchChip', { q: debouncedQuery })}
                    onRemove={() => setQuery('')}
                  />
                )}
                {treeLabel && (
                  <FilterChip
                    label={t('filters.categoryChip', { path: treeLabel })}
                    onRemove={() => setTreeSelection({ type: 'all' })}
                  />
                )}
                {quickFilters.gitDirtyOnly && (
                  <FilterChip
                    label={t('filters.gitDirtyOnly')}
                    onRemove={() => setQuickFilters((f) => ({ ...f, gitDirtyOnly: false }))}
                  />
                )}
                {quickFilters.invalidOnly && (
                  <FilterChip
                    label={t('filters.invalidOnly')}
                    onRemove={() => setQuickFilters((f) => ({ ...f, invalidOnly: false }))}
                  />
                )}
                {quickFilters.scriptsOnly && (
                  <FilterChip
                    label={t('filters.scriptsOnly')}
                    onRemove={() => setQuickFilters((f) => ({ ...f, scriptsOnly: false }))}
                  />
                )}
                {quickFilters.agentsIssueOnly && (
                  <FilterChip
                    label={t('filters.agentsIssueOnly')}
                    onRemove={() => setQuickFilters((f) => ({ ...f, agentsIssueOnly: false }))}
                  />
                )}
              </div>
            )}
          </div>
        }
        detail={
          <SkillDetailPanel
            skill={selected}
            onEdit={(id) => {
              if (selected?.readOnly) return;
              onEditSkill(id);
            }}
          />
        }
      >
        <SkillList
          items={filtered}
          loading={loading}
          selectedId={selected?.skillId ?? null}
          onSelect={setSelected}
          locale={locale}
        />
      </AppLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <GitPanel open={gitOpen} onClose={() => setGitOpen(false)} onCommitted={() => load()} />
      <SyncAgentsModal open={syncOpen} onClose={() => setSyncOpen(false)} onDone={() => load()} />
      <NewSkillDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          load();
          onEditSkill(id);
        }}
      />
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-zinc-200/80 py-1 pl-2 pr-1 text-[11px] text-zinc-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-zinc-800/80 dark:text-zinc-300 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-transform hover:bg-zinc-300/60 hover:text-zinc-800 active:scale-[0.96] dark:hover:bg-zinc-700/60 dark:hover:text-zinc-200"
      >
        ×
      </button>
    </span>
  );
}
