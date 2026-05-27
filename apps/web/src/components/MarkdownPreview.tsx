import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  markdown: string;
};

export function MarkdownPreview({ markdown }: Props) {
  return (
    <div className="markdown-preview space-y-3 p-4 text-sm text-zinc-300 [&_a]:text-emerald-400 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-zinc-100 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-zinc-100 [&_li]:ml-4 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || '*（空内容）*'}</ReactMarkdown>
    </div>
  );
}
