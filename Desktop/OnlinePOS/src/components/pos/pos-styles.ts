/** POS design tokens — premium register UI aligned with brand system */
export const pos = {
  bg: "bg-gradient-to-br from-brand-cream via-brand-rose/25 to-primary/10",
  surface: "bg-white/90",
  panel: "glass-panel",
  border: "border-primary/15",
  text: "text-foreground",
  muted: "text-muted-foreground",
  sectionLabel:
    "text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/55",
  card: "rounded-2xl border border-primary/15 bg-white/90 shadow-card backdrop-blur-sm",
  cardCompact:
    "rounded-xl border border-primary/15 bg-white/90 shadow-card backdrop-blur-sm",
  cardHover:
    "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft active:scale-[0.98] touch-manipulation",
  touchBtn: "min-h-11 min-w-11 touch-manipulation",
  input:
    "h-11 rounded-xl border-primary/20 bg-white/90 shadow-sm focus-visible:ring-primary/35",
  inputLg:
    "h-12 rounded-xl border-primary/20 bg-white/90 shadow-sm focus-visible:ring-primary/35",
  pill: "rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation",
  productGrid:
    "grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  productGridMobile: "grid grid-cols-2 gap-2.5 sm:grid-cols-3",
  checkoutFooter:
    "shrink-0 space-y-3 border-t border-primary/15 bg-gradient-to-t from-primary/20 via-brand-rose/25 to-white/95 p-4 backdrop-blur-sm sm:p-5",
} as const;
