// app/components/RichTextEditor.tsx or wherever you organize components

"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";
import type { Editor as TinyMCEEditor } from "tinymce";

export default function RichTextEditor(props: any) {
  const editorRef = useRef<TinyMCEEditor | null>(null);

  const logContent = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  return (
    <div className="my-3">
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY} // Optional for basic usage
        onInit={(_, editor) => (editorRef.current = editor)}
        onEditorChange={props.onChange}
        value={props.value}
        init={{
          height: 400,
          menubar: false,
          plugins: [
            "textcolor", // Legacy (optional)
            "lists", "link", "charmap", "preview", "anchor", "searchreplace",
            "visualblocks", "code", "fullscreen", "insertdatetime", "table",
            "help", "wordcount"
          ],
          toolbar:
            "undo redo | formatselect | bold italic underline | " +
            "forecolor backcolor | alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | help",
          toolbar_mode: "wrap",
          skin: "oxide-dark",
          content_css: "dark",
        }}
      />
      {/* <button
        onClick={logContent}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Log Content
      </button> */}
    </div>
  );
}
