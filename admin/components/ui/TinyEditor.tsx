// components/ui/TinyEditor.tsx
'use client';

import { useEffect, useRef } from 'react';
import tinymce from 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/plugins/code';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';

interface TinyEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const TinyEditor: React.FC<TinyEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      tinymce.init({
        target: editorRef.current,
        height: 400,
        plugins: ['code', 'lists', 'link'],
        toolbar:
          'undo redo | formatselect | bold italic underline | ' +
          'bullist numlist | code | link',
        skin: 'oxide-dark',
        content_css: 'dark',
        setup: (editor: any) => {
          editor.on('Change KeyUp', () => {
            onChange(editor.getContent());
          });
        },
      });
    }

    return () => {
      if (editorRef.current) {
        tinymce.remove(editorRef.current);
      }
    };
  }, [onChange]);

  return <textarea ref={editorRef} defaultValue={value} />;
};

export default TinyEditor;
