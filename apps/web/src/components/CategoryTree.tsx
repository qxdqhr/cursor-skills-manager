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
    <ul className={depth > 0 ? 'ml-2 border-l border-zinc-800 pl-2' : ''}>
      {nodes.map((node) => {
        const path = prefix ? `${prefix}/${node.id}` : node.id;
        return (
          <li key={path} className="py-0.5">
            <button
              type="button"
              onClick={() => onPick(path)}
              className="w-full rounded px-2 py-1 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <span className="text-zinc-300">{node.label}</span>
              <span className="ml-1 text-xs text-zinc-600">({node.skillCount})</span>
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
  if (!tree) {
    return <p className="text-sm text-zinc-600">加载分类…</p>;
  }

  const personalActive =
    selection.type === 'personal' ? selection.categoryPath : null;
  const projectActive =
    selection.type === 'project'
      ? { ws: selection.workspaceId, path: selection.categoryPath }
      : null;

  return (
    <div className="space-y-4 text-sm">
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className={`w-full rounded px-2 py-1.5 text-left ${
          selection.type === 'all'
            ? 'bg-emerald-900/40 text-emerald-200'
            : 'text-zinc-400 hover:bg-zinc-800'
        }`}
      >
        全部
      </button>

      <div>
        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          个人主库
        </p>
        <button
          type="button"
          onClick={() => onSelect({ type: 'personal', categoryPath: '' })}
          className={`mb-1 w-full rounded px-2 py-1 text-left text-xs ${
            personalActive === '' ? 'bg-emerald-900/40 text-emerald-200' : 'text-zinc-500 hover:bg-zinc-800'
          }`}
        >
          全部个人
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
            className="mb-1 truncate px-2 text-xs font-medium uppercase tracking-wider text-zinc-500"
            title={ws.workspacePath}
          >
            {ws.workspaceId}
          </p>
          <button
            type="button"
            onClick={() => onSelect({ type: 'project', workspaceId: ws.workspaceId, categoryPath: '' })}
            className={`mb-1 w-full rounded px-2 py-1 text-left text-xs ${
              projectActive?.ws === ws.workspaceId && projectActive.path === ''
                ? 'bg-emerald-900/40 text-emerald-200'
                : 'text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            全部该项目
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
