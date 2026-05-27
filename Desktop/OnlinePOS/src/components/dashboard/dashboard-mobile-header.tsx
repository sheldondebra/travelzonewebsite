"use client";

import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDashboardPageTitle } from "@/lib/dashboard-nav";

type Props = {
  onMenuClick: () => void;
};

export function DashboardMobileHeader({ onMenuClick }: Props) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const title = getDashboardPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[var(--app-mobile-header-height)] shrink-0 items-center gap-1 border-b border-gray-100/60 bg-white/80 px-2 backdrop-blur-xl safe-top lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 rounded-xl touch-manipulation"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </Button>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            {title}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 rounded-xl touch-manipulation"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="size-5" strokeWidth={1.75} />
        </Button>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-4 translate-y-0 gap-4 border-gray-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <GlobalSearch onNavigate={() => setSearchOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
