"use client";

import Link from "next/link";
import {
  Archive,
  Banknote,
  BarChart3,
  Lock,
  Maximize2,
  Minimize2,
  PauseCircle,
  RefreshCcw,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePosFullscreen } from "@/components/pos/pos-shell";
import type { PosDraft } from "@/stores/pos-cart";
import type { RegisterSession } from "@/components/pos/pos-register";

type ActiveCashier = {
  id: string;
  name: string | null;
  role: string;
};

function HeaderAction({
  title,
  onClick,
  disabled,
  badge,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="relative size-9 rounded-xl border border-primary/15 bg-white/80 text-foreground shadow-sm hover:border-primary/30 hover:bg-white sm:size-10"
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-white">
          {badge}
        </span>
      )}
    </Button>
  );
}

export function PosHeader({
  businessName,
  cartCount,
  grandTotal,
  formatMoney,
  drafts,
  draftsOpen,
  onDraftsOpenChange,
  onHold,
  onReset,
  onRestoreDraft,
  onDeleteDraft,
  registerSession,
  activeCashier,
  onSwitchCashier,
  onCloseRegister,
  onCashMovement,
  onRegisterReport,
}: {
  businessName?: string;
  cartCount: number;
  grandTotal: number;
  formatMoney: (n: number) => string;
  drafts: PosDraft[];
  draftsOpen: boolean;
  onDraftsOpenChange: (open: boolean) => void;
  onHold: () => void;
  onReset: () => void;
  onRestoreDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  registerSession?: RegisterSession | null;
  activeCashier?: ActiveCashier | null;
  onSwitchCashier?: () => void;
  onCloseRegister?: () => void;
  onCashMovement?: () => void;
  onRegisterReport?: () => void;
}) {
  const { isFullscreen, toggleFullscreen } = usePosFullscreen();

  return (
    <header className="relative shrink-0 border-b border-primary/20 bg-gradient-to-r from-primary/35 via-brand-rose/50 to-brand-cream px-3 py-2.5 safe-top sm:px-4 sm:py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(248_187_208/0.35),transparent_55%)]"
      />

      <div className="relative flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className:
              "size-9 shrink-0 rounded-xl border border-primary/15 bg-white/85 shadow-sm hover:bg-white sm:size-10",
          })}
          title="Back to dashboard"
        >
          <Sparkles className="size-4 text-primary sm:size-[1.125rem]" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="truncate text-sm font-bold tracking-tight sm:text-base">
              {businessName ?? "Point of sale"}
            </p>
            <Badge
              className={cn(
                "h-5 shrink-0 rounded-full border-0 px-2 text-[10px] font-semibold",
                registerSession
                  ? "bg-emerald-500/15 text-emerald-800"
                  : "bg-amber-500/15 text-amber-900",
              )}
            >
              <span
                className={cn(
                  "mr-1 inline-block size-1.5 rounded-full",
                  registerSession ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {registerSession ? "Register open" : "Register closed"}
            </Badge>
          </div>
          <p className="truncate text-[10px] text-foreground/65 sm:text-[11px]">
            {activeCashier?.name
              ? `Cashier · ${activeCashier.name}`
              : registerSession?.cashier?.name
                ? `Cashier · ${registerSession.cashier.name}`
                : "Register"}{" "}
            · {cartCount} {cartCount === 1 ? "item" : "items"}
          </p>
        </div>

        {cartCount > 0 && (
          <div className="hidden shrink-0 rounded-xl border border-primary/20 bg-primary px-3 py-1.5 text-right shadow-soft sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-primary-foreground/75">
              Sale total
            </p>
            <p className="text-sm font-bold tabular-nums text-primary-foreground">
              {formatMoney(grandTotal)}
            </p>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Dialog open={draftsOpen} onOpenChange={onDraftsOpenChange}>
            <DialogTrigger
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className:
                  "relative size-9 rounded-xl border border-primary/15 bg-white/80 shadow-sm hover:bg-white sm:size-10",
              })}
              title="Held sales"
            >
              <Archive className="size-4 sm:size-[1.125rem]" />
              {drafts.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-white">
                  {drafts.length}
                </span>
              )}
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-primary/15">
              <DialogHeader>
                <DialogTitle>Held sales</DialogTitle>
              </DialogHeader>
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No held sales</p>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {drafts.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-primary/15 bg-brand-cream/40 p-3"
                    >
                      <div>
                        <p className="font-medium">{d.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.items.length} lines ·{" "}
                          {new Date(d.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => onDeleteDraft(d.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={() => onRestoreDraft(d.id)}
                        >
                          Restore
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DialogContent>
          </Dialog>

          {onSwitchCashier && (
            <HeaderAction title="Switch cashier" onClick={onSwitchCashier}>
              <UserRound className="size-4 sm:size-[1.125rem]" />
            </HeaderAction>
          )}

          <HeaderAction title="Hold sale" onClick={onHold} disabled={cartCount === 0}>
            <PauseCircle className="size-4 sm:size-[1.125rem]" />
          </HeaderAction>

          {registerSession && onCashMovement && (
            <HeaderAction title="Cash in / out" onClick={onCashMovement}>
              <Banknote className="size-4 sm:size-[1.125rem]" />
            </HeaderAction>
          )}

          {registerSession && onRegisterReport && (
            <HeaderAction title="Register report" onClick={onRegisterReport}>
              <BarChart3 className="size-4 sm:size-[1.125rem]" />
            </HeaderAction>
          )}

          {registerSession && onCloseRegister && (
            <HeaderAction title="Close register" onClick={onCloseRegister}>
              <Lock className="size-4 sm:size-[1.125rem]" />
            </HeaderAction>
          )}

          <HeaderAction title="Reset checkout" onClick={onReset}>
            <RefreshCcw className="size-4 sm:size-[1.125rem]" />
          </HeaderAction>

          <HeaderAction
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4 sm:size-[1.125rem]" />
            ) : (
              <Maximize2 className="size-4 sm:size-[1.125rem]" />
            )}
          </HeaderAction>
        </div>
      </div>

      {cartCount > 0 && (
        <div className="relative mt-2 flex items-center justify-between rounded-xl border border-primary/20 bg-white/75 px-3 py-2 sm:hidden">
          <span className="text-xs font-medium text-muted-foreground">Sale total</span>
          <span className="text-base font-bold tabular-nums">{formatMoney(grandTotal)}</span>
        </div>
      )}
    </header>
  );
}
