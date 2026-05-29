import { useTranslation } from 'react-i18next';
import { CategoryTree, type TreeSelection } from './CategoryTree.js';
import type { SkillsTree } from '../types.js';

export type SkillQuickFilters = {
  gitDirtyOnly: boolean;
  invalidOnly: boolean;
  scriptsOnly: boolean;
  bindingIssueOnly: boolean;
  favoriteOnly: boolean;
};

export const EMPTY_QUICK_FILTERS: SkillQuickFilters = {
  gitDirtyOnly: false,
  invalidOnly: false,
  scriptsOnly: false,
  bindingIssueOnly: false,
  favoriteOnly: false,
};

export function BrowsePanel({
  tree,
  treeSelection,
  onTreeSelect,
  filters,
  onFiltersChange,
}: {
  tree: SkillsTree | null;
  treeSelection: TreeSelection;
  onTreeSelect: (s: TreeSelection) => void;
  filters: SkillQuickFilters;
  onFiltersChange: (next: SkillQuickFilters) => void;
}) {
  const { t } = useTranslation();

  const toggles: { key: keyof SkillQuickFilters; label: string }[] = [
    { key: 'gitDirtyOnly', label: t('filters.gitDirtyOnly') },
    { key: 'invalidOnly', label: t('filters.invalidOnly') },
    { key: 'scriptsOnly', label: t('filters.scriptsOnly') },
    { key: 'bindingIssueOnly', label: t('filters.bindingIssueOnly') },
    { key: 'favoriteOnly', label: t('filters.favoriteOnly') },
  ];

  const activeCount = toggles.filter(({ key }) => filters[key]).length;

  return (
    <div className="space-y-4 p-3">
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('filters.quickTitle')}
          </h3>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFiltersChange(EMPTY_QUICK_FILTERS)}
              className="text-xs text-emerald-600 transition-transform hover:text-emerald-500 active:scale-[0.96] dark:text-emerald-400"
            >
              {t('filters.clearAll')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {toggles.map(({ key, label }) => {
            const active = filters[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onFiltersChange({ ...filters, [key]: !active })}
                className={`rounded-md px-2.5 py-1.5 text-xs transition-[transform,background-color,color,box-shadow] active:scale-[0.96] ${
                  active
                    ? 'bg-emerald-100 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)] dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'bg-zinc-200/70 text-zinc-600 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
        <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {t('filters.categoryTitle')}
        </h3>
        <CategoryTree tree={tree} selection={treeSelection} onSelect={onTreeSelect} />
      </section>
    </div>
  );
}

export function sourceFromTree(sel: TreeSelection): 'all' | 'personal' | 'project' {
  if (sel.type === 'personal') return 'personal';
  if (sel.type === 'project') return 'project';
  return 'all';
}

export function countActiveQuickFilters(filters: SkillQuickFilters): number {
  return Object.values(filters).filter(Boolean).length;
}
