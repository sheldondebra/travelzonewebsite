"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type PosFullscreenContextValue = {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
  containerRef: RefObject<HTMLDivElement | null>;
};

const PosFullscreenContext = createContext<PosFullscreenContextValue | null>(
  null,
);

export function PosShell({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Browser blocked or unsupported — ignore
    }
  }, []);

  return (
    <PosFullscreenContext.Provider
      value={{ isFullscreen, toggleFullscreen, containerRef }}
    >
      <div
        ref={containerRef}
        data-pos-fullscreen={isFullscreen ? "true" : "false"}
        className="pos-shell fixed inset-0 z-30 flex flex-col overflow-hidden bg-gradient-to-br from-brand-cream via-brand-rose/30 to-primary/20 safe-top data-[pos-fullscreen=true]:z-[200] data-[pos-fullscreen=true]:!left-0 lg:left-[272px] data-[pos-fullscreen=true]:lg:!left-0"
      >
        {children}
      </div>
    </PosFullscreenContext.Provider>
  );
}

export function usePosFullscreen() {
  const ctx = useContext(PosFullscreenContext);
  if (!ctx) {
    throw new Error("usePosFullscreen must be used within PosShell");
  }
  return ctx;
}
