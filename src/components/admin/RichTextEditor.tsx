"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[280px] px-4 py-3 text-[#1d2327] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="admin-rich-editor admin-rich-editor-loading">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-toolbar">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="H3"
        />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="List"
        />
        <ToolbarButton
          label="Link"
          onClick={() => {
            const url = window.prompt("URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-rich-editor-btn${active ? " admin-rich-editor-btn-active" : ""}`}
    >
      {label}
    </button>
  );
}
