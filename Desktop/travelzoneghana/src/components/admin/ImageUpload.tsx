"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadMediaAction } from "@/app/admin/actions/upload";

type Props = {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ label, value, folder, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);

    startTransition(async () => {
      setError(null);
      const result = await uploadMediaAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onChange(result.url);
    });
  }

  return (
    <div>
      <label className="admin-label">{label}</label>
      <div className="flex flex-wrap items-start gap-4">
        {value ? (
          <div className="relative h-24 w-36 overflow-hidden rounded-[3px] border border-[#c3c4c7]">
            <Image src={value} alt="" fill className="object-cover" sizes="144px" />
          </div>
        ) : null}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="admin-button-secondary"
          >
            {pending ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL"
            className="admin-input"
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}
