/** Shared Tailwind class strings — keep styling in utilities, not global CSS. */
export const ui = {
  shell:
    'flex h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100',
  header:
    'flex shrink-0 items-center gap-4 border-b border-zinc-200 px-4 py-3 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]',
  btn:
    'rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] transition-[transform,background-color,color] hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] dark:hover:bg-zinc-800',
  btnPrimary: 'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600',
  input:
    'border border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
  muted: 'text-zinc-500 dark:text-zinc-500',
  panel:
    'rounded-xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/40',
  divider: 'divide-zinc-200 dark:divide-zinc-800/80',
  border: 'border-zinc-200 dark:border-zinc-800',
} as const;

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
