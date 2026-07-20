"use client";

import { ShoppingCart } from "lucide-react";
import { getStoreCourseIcon, formatGhs } from "@/lib/store-utils";

export function StoreCourseCard({
  title,
  description,
  price,
  icon,
  iconBg = "#EBF2FF",
  inCart = false,
  onAddToCart,
}: {
  title: string;
  description: string;
  price: number | string;
  icon: string;
  iconBg?: string;
  inCart?: boolean;
  onAddToCart?: () => void;
}) {
  const Icon = getStoreCourseIcon(icon);

  return (
    <article className="ed-card flex h-full flex-col p-4">
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-8 w-8 text-[#0057FF]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[14px] font-semibold leading-snug text-[#002B7F]">{title}</h3>
      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[#6B7280] line-clamp-2">
        {description}
      </p>
      <p className="mt-3 text-[14px] font-bold text-[#0057FF]">GHS {formatGhs(price)}</p>
      <button
        type="button"
        disabled={inCart}
        onClick={onAddToCart}
        className="mt-3 flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#002B7F] bg-white text-[13px] font-semibold text-[#002B7F] transition-colors hover:bg-[#F7F9FC] disabled:cursor-default disabled:opacity-60"
      >
        <ShoppingCart className="h-4 w-4" strokeWidth={2} />
        {inCart ? "In Cart" : "Add to Cart"}
      </button>
    </article>
  );
}
