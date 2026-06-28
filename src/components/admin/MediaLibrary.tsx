"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadMediaBatchAction } from "@/app/admin/actions/upload";

type Props = {
  folder: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  featuredImage: string;
  onFeaturedChange: (url: string) => void;
  gallery: string[];
  onGalleryChange: (urls: string[]) => void;
};

export function MediaLibrary({
  folder,
  images,
  onImagesChange,
  featuredImage,
  onFeaturedChange,
  gallery,
  onGalleryChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const formData = new FormData();
    formData.set("folder", folder);
    Array.from(fileList).forEach((file) => formData.append("files", file));

    startTransition(async () => {
      setError(null);
      const result = await uploadMediaBatchAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const merged = [...images];
      for (const url of result.urls) {
        if (!merged.includes(url)) merged.push(url);
      }
      onImagesChange(merged);

      const nextGallery = [...gallery];
      for (const url of result.urls) {
        if (!nextGallery.includes(url)) nextGallery.push(url);
      }
      onGalleryChange(nextGallery);

      if (!featuredImage && result.urls[0]) {
        onFeaturedChange(result.urls[0]);
      }

      if (result.error) {
        setError(`Some files failed: ${result.error}`);
      }

      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function toggleGallery(url: string) {
    if (gallery.includes(url)) {
      onGalleryChange(gallery.filter((item) => item !== url));
      if (featuredImage === url) {
        onFeaturedChange("");
      }
      return;
    }

    onGalleryChange([...gallery, url]);
    if (!featuredImage) onFeaturedChange(url);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="admin-media-dropzone"
      >
        {pending ? "Uploading and compressing…" : "Upload photos"}
        <span className="block text-[12px] font-normal text-[#646970]">
          JPG, PNG, or WebP — compressed automatically
        </span>
      </button>

      {images.length === 0 ? (
        <p className="m-0 text-[12px] text-[#646970]">
          No photos yet. Upload images for the tour gallery and featured photo.
        </p>
      ) : (
        <>
          <p className="m-0 text-[12px] text-[#646970]">
            Click a photo to include or remove it from the gallery. Use “Set
            featured” for the main tour image.
          </p>
          <div className="admin-media-grid">
            {images.map((url) => {
              const selected = gallery.includes(url);
              const featured = featuredImage === url;

              return (
                <div
                  key={url}
                  className={`admin-media-item ${selected ? "admin-media-item-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="admin-media-thumb"
                    onClick={() => toggleGallery(url)}
                    aria-pressed={selected}
                    aria-label={selected ? "Remove from gallery" : "Add to gallery"}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                    {selected ? (
                      <span className="admin-media-check" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                  <div className="admin-media-item-actions">
                    {featured ? (
                      <span className="admin-media-featured-label">Featured</span>
                    ) : (
                      <button
                        type="button"
                        className="admin-row-action-link"
                        onClick={() => {
                          onFeaturedChange(url);
                          if (!gallery.includes(url)) {
                            onGalleryChange([...gallery, url]);
                          }
                        }}
                      >
                        Set featured
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {error ? <p className="text-[13px] text-[#d63638]">{error}</p> : null}
    </div>
  );
}
