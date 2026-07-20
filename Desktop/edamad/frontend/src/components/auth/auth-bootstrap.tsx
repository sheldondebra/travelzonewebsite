"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthBootstrap() {
  useEffect(() => {
    const runBootstrap = () => {
      void useAuthStore.getState().bootstrap();
    };

    if (useAuthStore.persist.hasHydrated()) {
      runBootstrap();
      return;
    }

    return useAuthStore.persist.onFinishHydration(runBootstrap);
  }, []);

  return null;
}
