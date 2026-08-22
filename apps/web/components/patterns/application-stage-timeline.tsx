"use client";

import { cn } from "@/lib/utils/cn";
import type { ApplicationStatus } from "@/lib/api/applications";

interface Props {
  stages: readonly string[];
  currentStage: number;
  status: ApplicationStatus;
}

export function ApplicationStageTimeline({ stages, currentStage, status }: Props) {
  const isTerminated = status === "rejected" || status === "withdrawn";

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const isCompleted = i < currentStage;
        const isCurrent = i === currentStage && !isTerminated;
        const isPast = i <= currentStage;
        const isGreyed = isTerminated && i > currentStage;
        const isLast = i === stages.length - 1;

        return (
          <div key={stage} className="flex flex-1 items-center">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "size-3 rounded-full border-2 transition-all",
                  isGreyed
                    ? "border-border bg-surface opacity-40"
                    : isCompleted
                      ? "border-success bg-success"
                      : isCurrent
                        ? "border-primary bg-primary ring-4 ring-primary/20 animate-pulse"
                        : "border-border bg-surface",
                )}
              />
              <span
                className={cn(
                  "hidden text-[10px] sm:block whitespace-nowrap",
                  isGreyed
                    ? "text-text-muted/40"
                    : isPast
                      ? "text-text-muted"
                      : "text-text-muted/50",
                )}
              >
                {stage}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i < currentStage ? "bg-success" : "bg-border",
                  isGreyed && "opacity-30",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
