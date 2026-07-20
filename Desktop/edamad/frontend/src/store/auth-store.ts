import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ensureCsrfCookie } from "@/lib/api";
import { fetchCurrentUser } from "@/services/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  bootstrapped: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  bootstrap: () => Promise<void>;
}

let bootstrapPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      bootstrapped: false,
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
      bootstrap: async () => {
        if (get().bootstrapped) return;
        if (!bootstrapPromise) {
          bootstrapPromise = (async () => {
            try {
              await ensureCsrfCookie();
              const user = await fetchCurrentUser();
              set({ user, bootstrapped: true });
            } catch {
              set({ user: null, bootstrapped: true });
            }
          })();
        }
        await bootstrapPromise;
      },
    }),
    {
      name: "edamad-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export function useAuthReady() {
  return useAuthStore((s) => s.bootstrapped);
}
