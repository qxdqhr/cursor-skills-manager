import type { ReactNode } from 'react';

export function AppLayout({
  title,
  toolbar,
  sidebar,
  children,
  detail,
  gitPanel,
  onOpenSettings,
  headerActions,
}: {
  title: string;
  toolbar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  gitPanel?: ReactNode;
  onOpenSettings: () => void;
  headerActions?: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center gap-4 border-b border-zinc-800 px-4 py-3">
        <div className="shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-zinc-500">Cursor Skills Manager</p>
        </div>
        {toolbar}
        {headerActions}
        <button
          type="button"
          onClick={onOpenSettings}
          className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          设置
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 p-3">
          {sidebar}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        {detail && <aside className="w-80 shrink-0 overflow-y-auto">{detail}</aside>}
        {gitPanel}
      </div>
    </div>
  );
}
