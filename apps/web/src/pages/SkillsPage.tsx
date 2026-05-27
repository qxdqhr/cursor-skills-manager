import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppPreferences } from '../context/AppPreferences.js';
import { AppLayout } from '../components/AppLayout.js';
import { CategoryTree, type TreeSelection } from '../components/CategoryTree.js';
import { SearchBar, type SourceFilter } from '../components/SearchBar.js';
import { SkillDetailPanel } from '../components/SkillDetailPanel.js';
import { SkillList } from '../components/SkillList.js';
import { Toast } from '../components/Toast.js';
import { NewSkillDialog } from '../components/NewSkillDialog.js';
import { GitPanel } from '../components/GitPanel.js';
import { SyncAgentsModal } from '../components/SyncAgentsModal.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { ApiClientError, fetchSkills, fetchSkillsTree } from '../lib/api.js';
import { getStoredToken } from '../lib/token.js';
import type { SkillSummary, SkillsTree } from '../types.js';

function matchesTree(skill: SkillSummary, sel: TreeSelection): boolean {
  if (sel.type === 'all') return true;
  if (sel.type === 'project') {
    const prefix = `project:${sel.workspaceId}:`;
    if (!skill.skillId.startsWith(prefix)) return false;
    if (!sel.categoryPath) return true;
    return (
      skill.categoryPath === sel.categoryPath ||
      skill.categoryPath.startsWith(`${sel.categoryPath}/`) ||
      skill.name === sel.categoryPath
    );
  }
  if (skill.source !== 'personal') return false;
  if (!sel.categoryPath) return true;
  return (
    skill.categoryPath === sel.categoryPath ||
    skill.categoryPath.startsWith(`${sel.categoryPath}/`) ||
    skill.name === sel.categoryPath
  );
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
  const [source, setSource] = useState<SourceFilter>('all');
  const [gitDirtyOnly, setGitDirtyOnly] = useState(false);
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
        gitDirty: gitDirtyOnly || undefined,
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
  }, [debouncedQuery, source, gitDirtyOnly, t]);

  useEffect(() => {
    if (!getStoredToken()) return;
    fetchSkillsTree()
      .then(setTree)
      .catch(() => setTree({ personal: [], project: [] }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((s) => matchesTree(s, treeSelection));
  }, [items, treeSelection]);

  return (
    <>
      <AppLayout
        onOpenSettings={onOpenSettings}
        headerActions={
          <>
            <button type="button" onClick={() => setSyncOpen(true)} className="csm-btn">
              {t('nav.syncAgents')}
            </button>
            <button
              type="button"
              onClick={() => setGitOpen((o) => !o)}
              className={`csm-btn ${gitOpen ? 'border-emerald-600 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`}
            >
              {t('nav.git')}
            </button>
          </>
        }
        toolbar={
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            source={source}
            onSourceChange={setSource}
            gitDirtyOnly={gitDirtyOnly}
            onGitDirtyOnlyChange={setGitDirtyOnly}
          />
        }
        sidebar={
          <CategoryTree tree={tree} selection={treeSelection} onSelect={setTreeSelection} />
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
        gitPanel={
          <GitPanel open={gitOpen} onClose={() => setGitOpen(false)} onCommitted={() => load()} />
        }
      >
        <div className="flex h-full flex-col">
          <div className="csm-border flex items-center justify-between border-b px-4 py-2 text-xs">
            <span className="csm-muted">
              {loading
                ? t('skills.loading')
                : t('skills.count', { filtered: filtered.length, total: items.length })}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400"
              >
                {t('nav.new')}
              </button>
              <button
                type="button"
                onClick={() => load()}
                className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400"
              >
                {t('nav.refresh')}
              </button>
            </div>
          </div>
          <SkillList
            items={filtered}
            loading={loading}
            selectedId={selected?.skillId ?? null}
            onSelect={setSelected}
            locale={locale}
          />
        </div>
      </AppLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <SyncAgentsModal
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        onDone={() => load()}
      />
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
