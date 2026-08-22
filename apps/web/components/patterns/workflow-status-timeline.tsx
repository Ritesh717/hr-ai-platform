"use client";

import { Check, Clock, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowStage, WorkflowStageStatus } from "@/lib/api/onboarding";

const STATUS_CONFIG: Record<
  WorkflowStageStatus,
  {
    icon: React.ElementType;
    iconClass: string;
    lineClass: string;
    dotClass: string;
    labelClass: string;
  }
> = {
  completed: {
    icon: Check,
    iconClass: "text-success-foreground",
    dotClass: "bg-success border-success",
    lineClass: "bg-success",
    labelClass: "text-text",
  },
  "in-progress": {
    icon: Loader2,
    iconClass: "text-primary-foreground animate-spin",
    dotClass: "bg-primary border-primary",
    lineClass: "bg-border",
    labelClass: "text-text",
  },
  pending: {
    icon: Clock,
    iconClass: "text-text-muted",
    dotClass: "bg-surface border-border",
    lineClass: "bg-border",
    labelClass: "text-text-muted",
  },
  blocked: {
    icon: XCircle,
    iconClass: "text-danger-foreground",
    dotClass: "bg-danger border-danger",
    lineClass: "bg-border",
    labelClass: "text-text",
  },
};

interface Props {
  stages: WorkflowStage[];
}

export function WorkflowStatusTimeline({ stages }: Props) {
  return (
    <ol className="flex flex-col gap-0">
      {stages.map((stage, i) => {
        const cfg = STATUS_CONFIG[stage.status];
        const Icon = cfg.icon;
        const isLast = i === stages.length - 1;

        return (
          <li key={stage.id} className="flex gap-4">
            {/* Dot + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                  cfg.dotClass,
                )}
              >
                <Icon className={cn("size-3.5", cfg.iconClass)} />
              </div>
              {!isLast && (
                <div className={cn("w-0.5 flex-1 my-1", cfg.lineClass)} />
              )}
            </div>

            {/* Stage content */}
            <div className={cn("pb-5 min-w-0", isLast && "pb-0")}>
              <p className={cn("text-sm font-medium leading-8", cfg.labelClass)}>
                {stage.label}
              </p>
              <p className="text-xs text-text-muted">{stage.description}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
                {stage.assignedTo && (
                  <span>Assigned to <span className="font-medium text-text">{stage.assignedTo}</span></span>
                )}
                {stage.completedAt && (
                  <span>
                    Completed{" "}
                    {new Date(stage.completedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                {stage.estimatedDays && stage.status !== "completed" && (
                  <span>~{stage.estimatedDays} day{stage.estimatedDays !== 1 ? "s" : ""} remaining</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
