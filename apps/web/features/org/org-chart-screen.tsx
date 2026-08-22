"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEPARTMENTS, fetchOrgNodes } from "@/lib/api/org";
import { InteractiveOrgChart } from "@/components/patterns/interactive-org-chart";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgChartScreen() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org-nodes"],
    queryFn: fetchOrgNodes,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 text-sm"
          />
          <Button
            intent={deptFilter === null ? "primary" : "secondary"}
            size="sm"
            onClick={() => setDeptFilter(null)}
          >
            All
          </Button>
          {DEPARTMENTS.map((dept) => (
            <Button
              key={dept}
              intent={deptFilter === dept ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDeptFilter(deptFilter === dept ? null : dept)}
            >
              {dept}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <Card className="overflow-hidden p-0">
          {isLoading ? (
            <Skeleton className="h-[600px] w-full rounded-xl" />
          ) : data ? (
            <InteractiveOrgChart nodes={data} search={search} deptFilter={deptFilter} />
          ) : null}
        </Card>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="org" variant="rail" />
      </div>
    </div>
  );
}
