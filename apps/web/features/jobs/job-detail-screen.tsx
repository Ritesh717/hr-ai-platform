"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, MapPin } from "lucide-react";
import { fetchJobById } from "@/lib/api/jobs";
import { MatchScoreRing } from "@/components/patterns/match-score-ring";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { ApplyDrawer } from "./apply-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

const TYPE_TONE = {
  "Full-time": "success",
  "Contract":  "warning",
  "Remote":    "info",
  "Part-time": "neutral",
} as const;

interface Props {
  id: string;
}

export function JobDetailScreen({ id }: Props) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJobById(id),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-6 w-80 rounded-lg" />
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <Skeleton className="col-span-2 h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-text-muted">Job not found.</p>
      </div>
    );
  }

  const posted = new Date(job.postedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-text">{job.title}</h1>
            <Button
              intent="ghost"
              size="sm"
              onClick={() => setSaved((v) => !v)}
              aria-label={saved ? "Unsave" : "Save job"}
              className="shrink-0"
            >
              <Bookmark className={cn("size-4", saved && "fill-current text-primary")} />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{job.department}</Badge>
            <Badge tone={TYPE_TONE[job.type]}>{job.type}</Badge>
            <Badge tone="neutral">{job.experienceLevel}</Badge>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin className="size-3" />
              {job.location}
            </span>
            <span className="text-xs text-text-muted">Posted {posted}</span>
          </div>
          <div>
            <Button intent="primary" onClick={() => setApplyOpen(true)}>
              Apply now
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left — description */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            {job.sections.map((sec) => (
              <div key={sec.heading} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-text">{sec.heading}</h2>
                <div className="rounded-xl border border-border bg-surface p-4">
                  {sec.body.split("\n").map((line, i) => (
                    <p key={i} className="text-sm text-text leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right — match + AI */}
          <div className="flex flex-col gap-5">
            {/* Match score */}
            <Card>
              <CardContent className="flex flex-col items-center gap-4 pt-6 pb-5">
                <MatchScoreRing score={job.matchScore} size="lg" />
                <p className="text-xs text-text-muted">AI match score</p>

                {job.skillsMatch.length > 0 && (
                  <div className="w-full border-t border-border pt-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Skills breakdown
                    </p>
                    {job.skillsMatch.map((s) => (
                      <div key={s.skill} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-text">{s.skill}</span>
                        <Badge tone={s.matched ? "success" : "warning"}>
                          {s.matched ? "Matched" : `${s.yourLevel} / ${s.required}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI insight */}
            <AIInsightPanel context="careers" variant="rail" />
          </div>
        </div>
      </div>

      <ApplyDrawer open={applyOpen} onOpenChange={setApplyOpen} jobTitle={job.title} />
    </>
  );
}
