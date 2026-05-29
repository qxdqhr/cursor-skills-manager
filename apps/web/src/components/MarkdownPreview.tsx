import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/ui.js';

type Props = {
  markdown: string;
};

export function MarkdownPreview({ markdown }: Props) {
  return (
    <div
      className={cn(
        'markdown-preview space-y-3 p-4 text-sm text-zinc-700 dark:text-zinc-300',
        '[&_a]:text-emerald-700 dark:[&_a]:text-emerald-400',
        '[&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 dark:[&_code]:bg-zinc-800',
        '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-zinc-900 dark:[&_h1]:text-zinc-100',
        '[&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100',
        '[&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-3 dark:[&_pre]:bg-zinc-900',
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || '*（空内容）*'}</ReactMarkdown>
    </div>
  );
}
