import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function MarkdownEditor({ value, onChange, readOnly }: Props) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={vscodeDark}
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
