"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchJobs } from "@/lib/api/jobs";
import type { Job, JobType, ExperienceLevel } from "@/lib/api/jobs";
import { JobMatchCard } from "@/components/patterns/job-match-card";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type SortKey = "best-match" | "recent" | "alpha";

const DEPARTMENTS = ["All", "Engineering", "Product", "Data", "Design", "People"];
const LOCATIONS = ["All", "London, UK", "Remote"];
const TYPES: Array<"All" | JobType> = ["All", "Full-time", "Contract", "Remote", "Part-time"];
const LEVELS: Array<"All" | ExperienceLevel> = ["All", "Entry", "Mid", "Senior", "Lead", "Director"];

function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-text-muted">{label}:</span>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={
            value === opt
              ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
              : "rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted hover:border-primary/50 hover:text-text transition-colors"
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function JobsScreen() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    staleTime: 5 * 60 * 1000,
  });

  const [dept, setDept] = useState("All");
  const [loc, setLoc] = useState("All");
  const [type, setType] = useState<"All" | JobType>("All");
  const [level, setLevel] = useState<"All" | ExperienceLevel>("All");
  const [sort, setSort] = useState<SortKey>("best-match");

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (dept !== "All") list = list.filter((j) => j.department === dept);
    if (loc !== "All") list = list.filter((j) => j.location === loc);
    if (type !== "All") list = list.filter((j) => j.type === type);
    if (level !== "All") list = list.filter((j) => j.experienceLevel === level);

    if (sort === "best-match") list.sort((a, b) => b.matchScore - a.matchScore);
    else if (sort === "recent") list.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    else list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [jobs, dept, loc, type, level, sort]);

  const topMatches = useMemo(
    () => jobs.filter((j) => j.matchScore >= 80).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3),
    [jobs],
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Jobs Board"
          description={`${jobs.length} open role${jobs.length !== 1 ? "s" : ""} · internal listings`}
        />

        {/* AI Best Match section */}
        {!isLoading && topMatches.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-semibold text-text">Best match for you</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topMatches.map((job) => (
                <JobMatchCard key={job.id} job={job} highlighted />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <FilterChips label="Dept" options={DEPARTMENTS as string[]} value={dept} onChange={setDept} />
          <FilterChips label="Location" options={LOCATIONS as string[]} value={loc} onChange={setLoc} />
          <FilterChips label="Type" options={TYPES as string[]} value={type} onChange={(v) => setType(v as "All" | JobType)} />
          <FilterChips label="Level" options={LEVELS as string[]} value={level} onChange={(v) => setLevel(v as "All" | ExperienceLevel)} />
        </div>

        {/* Result count + sort */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {filtered.length} role{filtered.length !== 1 ? "s" : ""}
          </p>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best-match">Best match</SelectItem>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-14 text-center">
            <p className="text-sm text-text-muted">No roles match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((job) => (
              <JobMatchCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="careers" variant="rail" />
      </div>
    </div>
  );
}
