import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/AppLayout.js';
import { CategoryTree, type TreeSelection } from '../components/CategoryTree.js';
import { SearchBar, type SourceFilter } from '../components/SearchBar.js';
import { SkillDetailPanel } from '../components/SkillDetailPanel.js';
import { SkillList } from '../components/SkillList.js';
import { Toast } from '../components/Toast.js';
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

export function SkillsPage({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [treeSelection, setTreeSelection] = useState<TreeSelection>({ type: 'all' });
  const [tree, setTree] = useState<SkillsTree | null>(null);
  const [items, setItems] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SkillSummary | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const load = useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      setToast('请先在设置中配置 API Token');
      return;
    }
    setLoading(true);
    try {
      const sourceParam = source === 'all' ? undefined : source;
      const { items: list } = await fetchSkills({
        q: debouncedQuery || undefined,
        source: sourceParam,
      });
      setItems(list);
    } catch (e) {
      const msg =
        e instanceof ApiClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : '加载失败';
      setToast(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, source]);

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
        title="Skills"
        onOpenSettings={onOpenSettings}
        toolbar={
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            source={source}
            onSourceChange={setSource}
          />
        }
        sidebar={
          <CategoryTree tree={tree} selection={treeSelection} onSelect={setTreeSelection} />
        }
        detail={<SkillDetailPanel skill={selected} />}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">
            <span>
              {loading ? '加载中…' : `${filtered.length} / ${items.length} 项`}
            </span>
            <button
              type="button"
              onClick={() => load()}
              className="text-emerald-500 hover:text-emerald-400"
            >
              刷新
            </button>
          </div>
          <SkillList
            items={filtered}
            loading={loading}
            selectedId={selected?.skillId ?? null}
            onSelect={setSelected}
          />
        </div>
      </AppLayout>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
