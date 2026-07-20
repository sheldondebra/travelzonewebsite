"use client";

import Link from "next/link";
import { ChevronDown, Lock, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { formatGhs } from "@/lib/store-utils";
import type { CartItem } from "@/store/cart-store";

export function CartPanel({
  items = [],
  onRemove,
}: {
  items?: CartItem[];
  onRemove?: (id: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const count = items.length;
  const total = items.reduce((s, i) => s + i.price, 0);
  const isEmpty = count === 0;

  return (
    <article className="ed-card flex h-full min-h-[300px] flex-col p-4 lg:sticky lg:top-6 lg:self-start">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-[#0057FF]" strokeWidth={2} />
        <h3 className="text-[14px] font-semibold text-[#002B7F]">Your Cart</h3>
        <span className="rounded-full bg-[#0057FF] px-2 py-0.5 text-[11px] font-bold text-white">
          {count}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto text-[#6B7280]"
          aria-label="Toggle cart"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {!collapsed && (
        <>
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="mb-3 h-12 w-12 text-[#E5EAF2]" strokeWidth={1.25} />
              <p className="text-[13px] leading-relaxed text-[#6B7280]">
                No courses added yet.
                <br />
                Browse courses and add them to your cart.
              </p>
            </div>
          ) : (
            <ul className="mb-4 flex-1 space-y-2 overflow-y-auto text-[13px]">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-2 text-[#374151]">
                  <span className="line-clamp-2">{item.title}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-[#0057FF]">GHS {formatGhs(item.price)}</span>
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="rounded p-0.5 text-[#9CA3AF] hover:bg-[#F7F9FC] hover:text-[#374151]"
                        aria-label={`Remove ${item.title}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto border-t border-[#E5EAF2] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#002B7F]">Total</span>
              <span className="text-[16px] font-bold text-[#0057FF]">
                GHS {isEmpty ? "0.00" : formatGhs(total)}
              </span>
            </div>
            <Link
              href="/checkout"
              className={`ed-btn-navy mt-3 flex w-full items-center justify-center gap-2 ${isEmpty ? "pointer-events-none opacity-50" : ""}`}
            >
              <Lock className="h-4 w-4" />
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
