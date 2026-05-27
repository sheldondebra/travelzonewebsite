import Image from "next/image";
import { getProductImageUrl } from "@/lib/products/image";
import { cn } from "@/lib/utils";

export function ProductThumbnail({
  imageUrl,
  name,
  className,
  sizes = "48px",
}: {
  imageUrl?: string | null;
  name: string;
  className?: string;
  sizes?: string;
}) {
  const src = getProductImageUrl(imageUrl);
  const isLocalAsset =
    src.startsWith("/products/") || src === "/placeholder-product.svg";

  return (
    <div
      className={cn(
        "relative size-12 shrink-0 overflow-hidden rounded-xl bg-brand-rose/30",
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes={sizes}
        unoptimized={isLocalAsset || src.startsWith("http")}
      />
    </div>
  );
}
