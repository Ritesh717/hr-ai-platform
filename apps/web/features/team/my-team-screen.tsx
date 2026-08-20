"use client";

import { useMemo, useState } from "react";
import { useEmployees } from "@/features/employees/api";
import {
  defaultEmployeeFilters,
  EmployeeFilterBar,
  EmployeeGridCard,
  EmployeeListRow,
  EmployeeMiniTile,
  filterEmployees,
} from "@/features/employees/employee-list";
import { useTeamLeave } from "@/features/time-off/api";
import { LeaveDetailDialog } from "@/features/time-off/leave-detail-dialog";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { LeaveTeamEntry } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ListView, ViewModeToggle, type ListViewMode } from "@/components/patterns/list-view";
import { OrgChart } from "@/components/patterns/org-chart";
import { TeamCalendar, type TeamCalendarEvent } from "@/components/patterns/team-calendar";

const typeLabel = { vacation: "Vacation", sick: "Sick", personal: "Personal" } as const;

export function MyTeamScreen() {
  const { data: currentUser } = useCurrentUser();
  const {
    data: employees,
    isLoading: employeesLoading,
    isError: employeesError,
    refetch: refetchEmployees,
  } = useEmployees();
  const {
    data: teamEntries,
    isLoading: teamLoading,
    isError: teamError,
    refetch: refetchTeam,
  } = useTeamLeave(["pending", "approved"]);

  const [filters, setFilters] = useState(defaultEmployeeFilters);
  const [mode, setMode] = useState<ListViewMode>("list");
  const [selectedEntry, setSelectedEntry] = useState<LeaveTeamEntry | null>(null);

  const canApprove = currentUser?.permissions.has("leave.approve") ?? false;

  const myReports = useMemo(
    () => (employees ?? []).filter((employee) => employee.managerId === currentUser?.employeeId),
    [employees, currentUser?.employeeId],
  );
  const filteredReports = useMemo(() => filterEmployees(myReports, filters), [myReports, filters]);

  const calendarEvents = useMemo<TeamCalendarEvent[]>(
    () =>
      (teamEntries ?? []).map((entry) => ({
        requestId: entry.requestId,
        date: entry.startDate.slice(0, 10),
        employeeName: entry.employeeName,
        status: entry.status === "pending" ? "pending" : "approved",
        color: entry.status === "pending" ? "warning" : "info",
        label: `${entry.employeeName} — ${typeLabel[entry.type]} (${entry.status})`,
      })),
    [teamEntries],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Team" description="Your org chart and your team's leave calendar." />

      <Card>
        <CardHeader>
          <CardTitle>Org chart</CardTitle>
        </CardHeader>
        <CardContent>
          {employeesLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : employeesError ? (
            <ErrorState description="Couldn't load the org chart." onRetry={() => refetchEmployees()} />
          ) : currentUser ? (
            <OrgChart employees={employees ?? []} currentUserId={currentUser.employeeId} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {employeesError ? (
            <ErrorState description="Couldn't load your team." onRetry={() => refetchEmployees()} />
          ) : employeesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : myReports.length === 0 ? (
            <EmptyState
              title="No direct reports"
              description="You don't currently manage anyone, so there's no team to show here."
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <EmployeeFilterBar employees={myReports} filters={filters} onChange={setFilters} />
                <ViewModeToggle value={mode} onChange={setMode} />
              </div>
              <ListView
                mode={mode}
                items={filteredReports}
                getKey={(employee) => employee.id}
                renderList={() => (
                  <div className="flex flex-col gap-2">
                    {filteredReports.map((employee) => (
                      <EmployeeListRow key={employee.id} employee={employee} />
                    ))}
                  </div>
                )}
                renderGridCard={(employee) => <EmployeeGridCard employee={employee} />}
                renderMiniTile={(employee) => <EmployeeMiniTile employee={employee} />}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team leave calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {teamError ? (
            <ErrorState description="Couldn't load your team's leave." onRetry={() => refetchTeam()} />
          ) : teamLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (teamEntries ?? []).length === 0 ? (
            <EmptyState
              title="No team leave"
              description="You don't currently manage anyone, so there's no team leave to show."
            />
          ) : (
            <TeamCalendar
              events={calendarEvents}
              onEventClick={(requestId) =>
                setSelectedEntry((teamEntries ?? []).find((entry) => entry.requestId === requestId) ?? null)
              }
            />
          )}
        </CardContent>
      </Card>

      {selectedEntry && currentUser && (
        <LeaveDetailDialog
          key={selectedEntry.requestId}
          entry={selectedEntry}
          viewerEmployeeId={currentUser.employeeId}
          canApprove={canApprove}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
