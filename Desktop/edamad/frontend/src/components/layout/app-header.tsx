"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu, User } from "lucide-react";

const SUBTITLES: Record<string, string> = {
  "/dashboard": "Welcome to your learning dashboard!",
  "/courses/store": "Let's keep learning!",
  "/checkout": "Let's keep learning!",
  "/practice": "Test your knowledge with practice exams!",
  "/progress": "Let's keep learning!",
  "/profile": "Let's keep learning!",
  "/support": "Let's keep learning!",
  "/live-classes": "Let's keep learning!",
};

function resolveSubtitle(pathname: string) {
  if (SUBTITLES[pathname]) return SUBTITLES[pathname];
  if (pathname.startsWith("/courses")) return "Let's keep learning!";
  if (pathname.startsWith("/practice")) return "Let's keep learning!";
  return "Let's keep learning!";
}

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const pathname = usePathname();
  const line = subtitle ?? resolveSubtitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5EAF2] bg-white px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-1.5 text-[#002B7F] hover:bg-[#F7F9FC] lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[15px] font-semibold leading-tight text-[#002B7F]">
            Hello, Student <span className="font-normal">👋</span>
          </p>
          <p className="text-[12px] text-[#6B7280]">{line}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-[#002B7F] hover:bg-[#F7F9FC]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0057FF] px-1 text-[10px] font-bold leading-none text-white">
            3
          </span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-[#E5EAF2] bg-white py-1 pl-1 pr-2 hover:bg-[#F7F9FC]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5EAF2]">
            <User className="h-4 w-4 text-[#6B7280]" />
          </div>
          <ChevronDown className="h-4 w-4 text-[#6B7280]" />
        </button>
      </div>
    </header>
  );
}
