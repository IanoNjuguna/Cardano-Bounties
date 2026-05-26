"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import styles from "./ToastProvider.module.css";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
  notify: (toast: ToastInput) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 5200;

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = createToastId();
      const nextToast = { ...toast, id };

      setToasts((current) => [nextToast, ...current].slice(0, 4));
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify,
      success: (title: string, message?: string) => notify({ type: "success", title, message }),
      error: (title: string, message?: string) => notify({ type: "error", title, message }),
      info: (title: string, message?: string) => notify({ type: "info", title, message }),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastRegion} role="status" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className={`${styles.toast} ${styles[toast.type]}`} key={toast.id}>
            <div className={styles.toastIcon} aria-hidden="true" />
            <div>
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
