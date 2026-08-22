"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MessageSquare, Plus } from "lucide-react";
import { fetchCareerData } from "@/lib/api/careers";
import { CareerJourneyCard } from "@/components/patterns/career-journey-card";
import { SkillsGapChart } from "@/components/patterns/skills-gap-chart";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ActionChips() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild intent="secondary" size="sm">
        <Link href="/jobs">
          <Briefcase className="size-3.5" />
          View matching jobs
        </Link>
      </Button>
      <Button asChild intent="secondary" size="sm">
        <Link href="/chat">
          <MessageSquare className="size-3.5" />
          Talk to your manager
        </Link>
      </Button>
      <Button intent="ghost" size="sm">
        <Plus className="size-3.5" />
        Add a skill
      </Button>
    </div>
  );
}

export function CareersScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["careers"],
    queryFn: fetchCareerData,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Career Growth"
          description="Track your journey and close skill gaps to reach your next milestone"
        />

        {/* Career journey */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-4 text-sm font-semibold text-text">Career path</h2>
            {isLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : data ? (
              <CareerJourneyCard roles={data.journey} />
            ) : null}
          </CardContent>
        </Card>

        {/* Skills gap */}
        {isLoading ? (
          <Skeleton className="h-[320px] w-full rounded-xl" />
        ) : data ? (
          <SkillsGapChart skills={data.skills} targetRole={data.targetRole} />
        ) : null}

        {/* Action chips */}
        <ActionChips />
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="careers" variant="rail" />
      </div>
    </div>
  );
}
