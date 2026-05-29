import { useTranslation } from 'react-i18next';
import type { SkillTreeNode, SkillsTree } from '../types.js';

export type TreeSelection =
  | { type: 'all' }
  | { type: 'personal'; categoryPath: string }
  | { type: 'project'; workspaceId: string; categoryPath: string };

function TreeNodes({
  nodes,
  depth,
  prefix,
  onPick,
}: {
  nodes: SkillTreeNode[];
  depth: number;
  prefix: string;
  onPick: (path: string) => void;
}) {
  return (
    <ul className={depth > 0 ? 'csm-border ml-2 border-l pl-2' : ''}>
      {nodes.map((node) => {
        const path = prefix ? `${prefix}/${node.id}` : node.id;
        return (
          <li key={path} className="py-0.5">
            <button
              type="button"
              onClick={() => onPick(path)}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <span className="text-zinc-800 dark:text-zinc-300">{node.label}</span>
              <span className="csm-muted ml-1 text-xs tabular-nums">({node.skillCount})</span>
            </button>
            {node.children.length > 0 && (
              <TreeNodes nodes={node.children} depth={depth + 1} prefix={path} onPick={onPick} />
            )}
          </li>
        );
      })}
    </ul>
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

  if (!tree) {
    return <p className="csm-muted text-sm">{t('tree.loading')}</p>;
  }

  const personalActive = selection.type === 'personal' ? selection.categoryPath : null;
  const projectActive =
    selection.type === 'project'
      ? { ws: selection.workspaceId, path: selection.categoryPath }
      : null;

  const activeCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  const idleCls =
    'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800';

  return (
    <div className="space-y-4 text-sm">
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className={`w-full rounded-md px-2 py-1.5 text-left transition-colors active:scale-[0.98] ${
          selection.type === 'all' ? activeCls : idleCls
        }`}
      >
        {t('tree.all')}
      </button>

      <div>
        <p className="csm-muted mb-1 px-2 text-xs font-medium uppercase tracking-wider">
          {t('tree.personal')}
        </p>
        <button
          type="button"
          onClick={() => onSelect({ type: 'personal', categoryPath: '' })}
          className={`mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-colors active:scale-[0.98] ${
            personalActive === '' ? activeCls : idleCls
          }`}
        >
          {t('tree.personalAll')}
        </button>
        <TreeNodes
          nodes={tree.personal}
          depth={0}
          prefix=""
          onPick={(path) => onSelect({ type: 'personal', categoryPath: path })}
        />
      </div>

      {tree.project.map((ws) => (
        <div key={ws.workspaceId}>
          <p
            className="csm-muted mb-1 truncate px-2 text-xs font-medium uppercase tracking-wider"
            title={ws.workspacePath}
          >
            {ws.workspaceId}
          </p>
          <button
            type="button"
            onClick={() => onSelect({ type: 'project', workspaceId: ws.workspaceId, categoryPath: '' })}
            className={`mb-1 w-full rounded-md px-2 py-1 text-left text-xs transition-colors active:scale-[0.98] ${
              projectActive?.ws === ws.workspaceId && projectActive.path === ''
                ? activeCls
                : idleCls
            }`}
          >
            {t('tree.projectAll')}
          </button>
          <TreeNodes
            nodes={ws.categories}
            depth={0}
            prefix=""
            onPick={(path) =>
              onSelect({ type: 'project', workspaceId: ws.workspaceId, categoryPath: path })
            }
          />
        </div>
      ))}
    </div>
  );
}
