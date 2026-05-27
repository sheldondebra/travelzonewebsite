import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveCashier = {
  id: string;
  name: string | null;
  role: string;
};

type PosCashierState = {
  cashier: ActiveCashier | null;
  token: string | null;
  setCashier: (cashier: ActiveCashier, token: string) => void;
  clearCashier: () => void;
};

export const usePosCashier = create<PosCashierState>()(
  persist(
    (set) => ({
      cashier: null,
      token: null,
      setCashier: (cashier, token) => set({ cashier, token }),
      clearCashier: () => set({ cashier: null, token: null }),
    }),
    { name: "pos-cashier-v1" },
  ),
);

export function posCashierHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["X-Pos-Cashier-Token"] = token;
  return headers;
}

export function posCashierBody<T extends object>(
  payload: T,
  token?: string | null,
): T & { cashierToken?: string } {
  return token ? { ...payload, cashierToken: token } : payload;
}
