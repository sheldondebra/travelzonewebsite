"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  Camera,
  Check,
  ImageIcon,
  Images,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { getProductImageUrl } from "@/lib/products/image";
import { cn } from "@/lib/utils";

type GalleryItem = { url: string; name: string };

type Props = {
  value: string;
  onChange: (url: string) => void;
  productName?: string;
  className?: string;
};

export function ProductImagePicker({
  value,
  onChange,
  productName = "Product",
  className,
}: Props) {
  const queryClient = useQueryClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displaySrc = previewUrl || (value ? getProductImageUrl(value) : null);
  const hasImage = Boolean(displaySrc && displaySrc !== "/placeholder-product.svg");

  const { data: gallery = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["product-image-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/products/upload-image");
      return parseApiResponse<GalleryItem[]>(res);
    },
    enabled: pickerOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/products/upload-image", {
        method: "POST",
        body: form,
      });
      return parseApiResponse<{ url: string }>(res);
    },
    onSuccess: (data) => {
      setPreviewUrl(null);
      onChange(data.url);
      queryClient.invalidateQueries({ queryKey: ["product-image-gallery"] });
      toast.success("Photo added");
      setPickerOpen(false);
    },
    onError: (e: Error) => {
      setPreviewUrl(null);
      toast.error(e.message);
    },
  });

  function handleFile(file: File | null) {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    uploadMutation.mutate(file);
  }

  function clearImage() {
    setPreviewUrl(null);
    onChange("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className={cn(
          "group relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-dashed transition-all touch-manipulation",
          hasImage
            ? "border-gray-100 bg-white shadow-soft"
            : "border-primary/25 bg-gradient-to-b from-brand-cream/60 to-white hover:border-primary/40 hover:bg-brand-cream/40",
        )}
      >
        <div className="relative aspect-square w-full sm:aspect-[4/3] sm:max-h-72">
          {hasImage && displaySrc ? (
            <>
              <Image
                src={displaySrc}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
                unoptimized={displaySrc.startsWith("blob:")}
              />
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-medium shadow-soft">
                  Change photo
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ImageIcon className="size-8" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-medium text-foreground">Add product photo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap to take a photo or pick from your gallery
                </p>
              </div>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Uploading…</p>
            </div>
          )}
        </div>
      </button>

      {hasImage && (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="touch-manipulation"
          >
            <Images className="mr-1.5 size-4" />
            Change
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearImage}
            className="text-muted-foreground touch-manipulation"
          >
            <Trash2 className="mr-1.5 size-4" />
            Remove
          </Button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="flex max-h-[min(92dvh,720px)] flex-col gap-0 overflow-hidden rounded-3xl border-primary/15 bg-white p-0 shadow-elevated sm:max-w-lg">
          <DialogHeader className="border-b border-primary/10 bg-gradient-to-br from-brand-cream via-white to-brand-rose/40 px-5 py-5 text-left">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/25 text-foreground shadow-sm">
                <ImageIcon className="size-5" />
              </span>
              <div>
                <DialogTitle>Product photo</DialogTitle>
                <DialogDescription className="mt-1 leading-relaxed">
                  Add a clean product image from camera, phone gallery, URL, or saved store images.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="group rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-brand-cream to-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-soft disabled:pointer-events-none disabled:opacity-60 touch-manipulation"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Camera className="size-5" />
                </span>
                <span className="block text-sm font-semibold text-foreground">
                  Take photo
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  Opens the camera on supported phones and tablets.
                </span>
              </button>
              <button
                type="button"
                className="group rounded-2xl border-2 border-gray-200 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-brand-rose/20 hover:shadow-soft disabled:pointer-events-none disabled:opacity-60 touch-manipulation"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-lavender/45 text-foreground shadow-sm">
                  <Upload className="size-5" />
                </span>
                <span className="block text-sm font-semibold text-foreground">
                  Photo library
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  Pick an existing image from your device files or gallery.
                </span>
              </button>
            </div>

            <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
              <Label htmlFor="image-url" className="text-sm font-semibold text-foreground">
                Image URL
              </Label>
              <Input
                id="image-url"
                placeholder="https://example.com/photo.jpg"
                value={value.startsWith("http") ? value : ""}
                className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:ring-primary/30"
                onChange={(e) => {
                  setPreviewUrl(null);
                  onChange(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Optional: paste a direct image link if you already have one.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Store gallery</p>
                <span className="text-xs text-muted-foreground">
                  Previously uploaded
                </span>
              </div>

              {galleryLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse rounded-xl bg-muted/60"
                    />
                  ))}
                </div>
              ) : gallery.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-brand-cream/35 px-4 py-8 text-center text-sm text-muted-foreground">
                  No store images yet. Upload your first photo above.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {gallery.map((item) => {
                    const selected = value === item.url;
                    return (
                      <button
                        key={item.url}
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          onChange(item.url);
                          toast.success("Photo selected");
                          setPickerOpen(false);
                        }}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl border-2 transition-all touch-manipulation",
                          selected
                            ? "border-primary ring-2 ring-primary/25"
                            : "border-transparent hover:border-primary/30",
                        )}
                      >
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                        {selected && (
                          <span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                            <Check className="size-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 p-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-gray-200 bg-white touch-manipulation"
              onClick={() => setPickerOpen(false)}
            >
              <X className="mr-2 size-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
