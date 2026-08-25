"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A 4xx (unauthorized, forbidden, not found, validation) will never succeed on
            // retry — React Query's default of 3 retries with backoff just leaves screens
            // showing a loading skeleton for ~7s before the real (already-built) error state
            // appears. Only retry on network failures / 5xx.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
              return failureCount < 3;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
