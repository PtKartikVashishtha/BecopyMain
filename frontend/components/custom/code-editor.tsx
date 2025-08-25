import { useEffect, useRef, useState } from "react";
import * as shiki from "shiki";
import { ScrollArea } from "../ui/scroll-area";

interface CodeEditorProps {
  code: string,
  lang: string,
  theme: string,
  editable: boolean,
}

const CodeEditor = ({ code, lang, theme, editable }: CodeEditorProps) => {
  const [highlightedCode, setHighlightedCode] = useState(code);
  const [sourceCode, setSourceCode] = useState(code);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    if (editorRef.current) {
      setSourceCode(editorRef.current.innerText)
    }
  }
  useEffect(() => {
    setSourceCode(code);
  }, [code])

  useEffect(() => {
    const highlight = async () => {
      const highlighter = await shiki.createHighlighter({
        themes: ['light-plus', 'monokai', 'dark-plus'],
        langs: ['javascript', 'python', 'java', 'html']
      });

      const highlighted = highlighter.codeToHtml(sourceCode, {
        lang,
        theme,
      });
      setHighlightedCode(highlighted);
    };

    highlight();
  }, [sourceCode, lang, theme, editable]);
  const syncScroll = () => {
    if (!editorRef.current || !textareaRef.current) return;
    editorRef.current.scrollTop = textareaRef.current.scrollTop;
    editorRef.current.scrollLeft = textareaRef.current.scrollLeft;
  };
  return (
    <div
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      className="shiki"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* <textarea
        ref={textareaRef}
        value={sourceCode}
        onChange={(e) => setSourceCode(e.target.value)}
        onScroll={syncScroll}
        className="relative w-full h-64 bg-transparent text-transparent caret-white p-4 resize-none outline-none overflow-auto"
        spellCheck={false}
      /> */}
    </div>
  )
}

export default CodeEditor;
