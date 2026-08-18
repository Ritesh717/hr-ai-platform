"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toneClass: Record<ToastTone, string> = {
  success: "border-success/30 text-success",
  error: "border-danger/30 text-danger",
  info: "border-info/30 text-info",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <ToastPrimitive.Root
              key={toast.id}
              duration={5000}
              onOpenChange={(open) => {
                if (!open) remove(toast.id);
              }}
              className={cn(
                "flex items-start gap-3 rounded-lg border bg-surface p-4 shadow-md",
                toneClass[toast.tone],
              )}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div className="flex-1">
                <ToastPrimitive.Title className="text-sm font-medium text-text">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description ? (
                  <ToastPrimitive.Description className="mt-1 text-sm text-text-muted">
                    {toast.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close className="text-text-muted hover:text-text">
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.push;
}

export { TriangleAlert as ToastWarningIcon };
