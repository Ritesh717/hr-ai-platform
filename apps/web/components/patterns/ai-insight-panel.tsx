"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { fetchInsight, type InsightContext, type InsightContent } from "@/lib/api/insights";

export interface AIInsightPanelProps {
  /** Screen context — determines which AI insight is fetched */
  context: InsightContext;
  /** Pre-rendered content for SSR / static mocks; skips the fetch when provided */
  initialContent?: InsightContent;
  /** "rail" = narrow right-side panel; "block" = full-width embedded block */
  variant?: "rail" | "block";
  className?: string;
}

export function AIInsightPanel({
  context,
  initialContent,
  variant = "block",
  className,
}: AIInsightPanelProps) {
  const [content, setContent] = useState<InsightContent | null>(initialContent ?? null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialContent) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchInsight(context)
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [context, initialContent]);

  // Hide gracefully on error
  if (error) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-glass-border bg-primary-weak p-4 backdrop-blur-glass backdrop-saturate-150",
        variant === "rail" && "max-w-[280px]",
        className,
      )}
      role="region"
      aria-label="AI Insight"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 shrink-0 text-primary" />
        <span className="text-meta text-text-subtle">AI Insight</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ) : content ? (
        <>
          <p className="text-sm leading-relaxed text-text">{content.summary}</p>
          {content.detail && (
            <p className="text-sm text-text-muted">{content.detail}</p>
          )}
          {content.actions && content.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.actions.map((action) =>
                action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-pill border border-glass-border bg-chip px-3 py-1 text-xs font-medium text-text transition-colors hover:bg-surface"
                  >
                    {action.label}
                  </Link>
                ) : null,
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
