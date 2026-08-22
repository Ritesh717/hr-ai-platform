"use client";

import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import { useState } from "react";
import { MatchScoreRing } from "./match-score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { Job } from "@/lib/api/jobs";

const TYPE_TONE = {
  "Full-time": "success",
  "Contract":  "warning",
  "Remote":    "info",
  "Part-time": "neutral",
} as const;

interface Props {
  job: Job;
  highlighted?: boolean;
}

export function JobMatchCard({ job, highlighted = false }: Props) {
  const [saved, setSaved] = useState(false);
  const posted = new Date(job.postedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        highlighted && "border-primary/30 bg-primary/5",
      )}
    >
      {/* Match ring */}
      <div className="absolute right-4 top-4">
        <MatchScoreRing score={job.matchScore} size="sm" />
      </div>

      {/* Content */}
      <div className="pr-14">
        <Link href={`/jobs/${job.id}`} className="group">
          <p className="font-semibold text-text group-hover:text-primary transition-colors">
            {job.title}
          </p>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{job.department}</Badge>
          <Badge tone={TYPE_TONE[job.type]}>{job.type}</Badge>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
          <MapPin className="size-3" />
          {job.location}
          <span className="mx-1">·</span>
          <span>{job.experienceLevel}</span>
          <span className="mx-1">·</span>
          <span>Posted {posted}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button asChild intent="secondary" size="sm" className="flex-1">
          <Link href={`/jobs/${job.id}`}>Apply</Link>
        </Button>
        <Button
          intent="ghost"
          size="sm"
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "Unsave job" : "Save job"}
        >
          <Bookmark className={cn("size-4", saved && "fill-current text-primary")} />
        </Button>
      </div>
    </Card>
  );
}
