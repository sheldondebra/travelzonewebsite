"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  maxLength?: number;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, maxLength = 2000, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const plainLength = value.replace(/<[^>]+>/g, "").length;

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function exec(cmd: string, val?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5EAF2]">
      <div className="flex flex-wrap gap-1 border-b border-[#E5EAF2] bg-[#F7F9FC] px-2 py-1.5">
        {[
          { icon: Bold, cmd: "bold", label: "Bold" },
          { icon: Italic, cmd: "italic", label: "Italic" },
          { icon: Underline, cmd: "underline", label: "Underline" },
          { icon: List, cmd: "insertUnorderedList", label: "Bullet list" },
          { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered list" },
        ].map(({ icon: Icon, cmd, label }) => (
          <button
            key={cmd}
            type="button"
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(cmd)}
            className="rounded p-1.5 text-[#374151] hover:bg-white"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          aria-label="Insert link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (url) exec("createLink", url);
          }}
          className="rounded p-1.5 text-[#374151] hover:bg-white"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className="min-h-[140px] px-3 py-2.5 text-[13px] leading-relaxed text-[#374151] outline-none empty:before:text-[#9CA3AF] empty:before:content-[attr(data-placeholder)]"
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
      />
      <div className="border-t border-[#E5EAF2] px-3 py-1.5 text-right text-[11px] text-[#9CA3AF]">
        {plainLength}/{maxLength}
      </div>
    </div>
  );
}
