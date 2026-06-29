"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type AdminToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  setBusy: (busy: boolean, label?: string) => void;
  busy: boolean;
  busyLabel: string | null;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error("useAdminToast must be used within AdminToastProvider.");
  }
  return context;
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="admin-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`admin-toast admin-toast-${toast.variant}`}
        >
          <p className="admin-toast-message">{toast.message}</p>
          <button
            type="button"
            className="admin-toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function AdminBusyBar({ busy, label }: { busy: boolean; label: string | null }) {
  if (!busy) return null;

  return (
    <div className="admin-busy-bar" role="status" aria-live="polite">
      <div className="admin-busy-bar-track">
        <div className="admin-busy-bar-fill" />
      </div>
      <span className="admin-busy-bar-label">{label ?? "Working…"}</span>
    </div>
  );
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [busyCount, setBusyCount] = useState(0);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const toastIdRef = useRef(0);
  const busyCountRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const id = toastIdRef.current + 1;
      toastIdRef.current = id;
      setToasts((current) => [...current, { id, variant, message: trimmed }].slice(-4));

      window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION_MS);
    },
    [dismissToast],
  );

  const success = useCallback(
    (message: string) => pushToast("success", message),
    [pushToast],
  );
  const error = useCallback(
    (message: string) => pushToast("error", message),
    [pushToast],
  );
  const info = useCallback(
    (message: string) => pushToast("info", message),
    [pushToast],
  );

  const setBusy = useCallback((busy: boolean, label?: string) => {
    if (busy) {
      busyCountRef.current += 1;
      setBusyCount(busyCountRef.current);
      if (label) setBusyLabel(label);
      return;
    }

    busyCountRef.current = Math.max(0, busyCountRef.current - 1);
    setBusyCount(busyCountRef.current);
    if (busyCountRef.current === 0) {
      setBusyLabel(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      success,
      error,
      info,
      setBusy,
      busy: busyCount > 0,
      busyLabel,
    }),
    [success, error, info, setBusy, busyCount, busyLabel],
  );

  return (
    <AdminToastContext.Provider value={value}>
      <AdminBusyBar busy={busyCount > 0} label={busyLabel} />
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AdminToastContext.Provider>
  );
}

export type AdminActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export function useAdminActionFeedback(
  state: AdminActionResult | undefined,
  pending: boolean,
  options?: {
    successMessage?: string;
    loadingMessage?: string;
    refresh?: boolean;
  },
) {
  const router = useRouter();
  const { success, error, setBusy } = useAdminToast();
  const handledRef = useRef<AdminActionResult | undefined>(undefined);

  useEffect(() => {
    if (pending) {
      handledRef.current = undefined;
    }
    setBusy(pending, options?.loadingMessage ?? (pending ? "Saving…" : undefined));
  }, [pending, setBusy, options?.loadingMessage]);

  useEffect(() => {
    if (!state || state === handledRef.current) return;
    handledRef.current = state;

    if (state.success) {
      success(options?.successMessage ?? state.message ?? "Saved successfully.");
      if (options?.refresh !== false) {
        router.refresh();
      }
      return;
    }

    if (state.error) {
      error(state.error);
    }
  }, [state, success, error, router, options?.successMessage, options?.refresh]);
}

export function useAdminAsyncAction() {
  const router = useRouter();
  const { success, error, setBusy } = useAdminToast();

  return useCallback(
    async (
      run: () => Promise<AdminActionResult>,
      options?: {
        loadingMessage?: string;
        successMessage?: string;
        refresh?: boolean;
      },
    ) => {
      setBusy(true, options?.loadingMessage ?? "Saving…");
      try {
        const result = await run();
        if (result.success) {
          success(options?.successMessage ?? result.message ?? "Saved successfully.");
          if (options?.refresh !== false) {
            router.refresh();
          }
        } else if (result.error) {
          error(result.error);
        }
        return result;
      } finally {
        setBusy(false);
      }
    },
    [router, success, error, setBusy],
  );
}
