"use client";

import Image from "next/image";
import { useRef, useTransition } from "react";
import { uploadMediaAction } from "@/app/admin/actions/upload";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

type Props = {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ label, value, folder, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const { success, error, setBusy } = useAdminToast();

  function handleUpload(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);

    startTransition(async () => {
      setBusy(true, "Uploading image…");
      try {
        const result = await uploadMediaAction(formData);
        if (result.success) {
          success("Image uploaded.");
          onChange(result.url);
          return;
        }
        error(result.error);
      } finally {
        setBusy(false);
      }
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
    </div>
  );
}
