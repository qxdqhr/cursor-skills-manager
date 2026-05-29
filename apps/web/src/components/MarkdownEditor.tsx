import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { useResolvedTheme } from '../hooks/useResolvedTheme.js';

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function MarkdownEditor({ value, onChange, readOnly }: Props) {
  const resolvedTheme = useResolvedTheme();
  const cmTheme = resolvedTheme === 'dark' ? vscodeDark : vscodeLight;

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={cmTheme}
      extensions={[markdown()]}
      editable={!readOnly}
      onChange={onChange}
      className="h-full min-h-[200px] text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
    />
  );
}
