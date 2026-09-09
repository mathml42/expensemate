import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "../../lib/cn";

type ToastVariant = "default" | "success" | "error" | "warning";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastRecord = ToastInput & { id: number; variant: ToastVariant; leaving?: boolean };

type ToastContextValue = {
  toast: (input: ToastInput) => number;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, { accent: string; icon: ReactNode }> = {
  default: { accent: "border-l-info-500 dark:border-l-info-400", icon: <Info className="h-5 w-5 text-info-600 dark:text-info-400" /> },
  success: {
    accent: "border-l-success-600 dark:border-l-success-400",
    icon: <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />,
  },
  error: {
    accent: "border-l-danger-600 dark:border-l-danger-400",
    icon: <XCircle className="h-5 w-5 text-danger-600 dark:text-danger-400" />,
  },
  warning: {
    accent: "border-l-warning-600 dark:border-l-warning-400",
    icon: <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 150);
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", duration }: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, title, description, variant }]);
      window.setTimeout(() => remove(id), duration ?? (variant === "error" ? 6000 : 4000));
      return id;
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0">
          {toasts.map((item) => {
            const styles = variantStyles[item.variant];
            return (
              <div
                key={item.id}
                role="status"
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-slate-200 border-l-[3px] bg-white p-3.5 shadow-elevated dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
                  styles.accent,
                  item.leaving ? "animate-toast-out" : "animate-toast-in",
                )}
              >
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
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
