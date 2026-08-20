"use client";

import { Calendar, CalendarCheck, CalendarClock, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getLeaveRequestColumns } from "@/features/time-off/columns";
import { HolidayFormDialog } from "@/features/time-off/holiday-form-dialog";
import { LeaveRequestDialog } from "@/features/time-off/leave-request-dialog";
import {
  useCreateHoliday,
  useCreateLeaveRequest,
  useDeleteHoliday,
  useHolidays,
  useLeaveBalance,
  useLeaveRequests,
  useTeamLeave,
  useUpdateLeaveStatus,
} from "@/features/time-off/api";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/patterns/data-table";
import { EmptyState } from "@/components/patterns/empty-state";
import { MiniCalendar, type MiniCalendarEvent } from "@/components/patterns/mini-calendar";
import { StatCard } from "@/components/patterns/stat-card";

const typeLabel = { vacation: "Vacation", sick: "Sick", personal: "Personal" } as const;

export function TimeOffScreen() {
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const canApprove = currentUser?.permissions.has("leave.approve") ?? false;
  const canManageHolidays = currentUser?.permissions.has("leave.manage") ?? false;

  const { data: balance } = useLeaveBalance();
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests();
  const { data: teamApproved } = useTeamLeave();
  const { data: teamPending } = useTeamLeave("pending");
  const { data: holidays, isLoading: holidaysLoading } = useHolidays();

  const createRequest = useCreateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const [requesting, setRequesting] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);

  const calendarEvents = useMemo<MiniCalendarEvent[]>(() => {
    const events: MiniCalendarEvent[] = [];
    for (const request of requests ?? []) {
      if (request.status === "rejected") continue;
      events.push({
        date: request.startDate.slice(0, 10),
        color: request.status === "pending" ? "warning" : "primary",
        label: `You — ${typeLabel[request.type]} (${request.status})`,
      });
    }
    for (const entry of teamApproved ?? []) {
      events.push({ date: entry.startDate.slice(0, 10), color: "info", label: `${entry.employeeName} — ${typeLabel[entry.type]}` });
    }
    for (const holiday of holidays ?? []) {
      events.push({ date: holiday.date.slice(0, 10), color: "success", label: holiday.name });
    }
    return events;
  }, [requests, teamApproved, holidays]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time off"
        description="Your leave balance, requests, and the team calendar."
        actions={<Button onClick={() => setRequesting(true)}>Request time off</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Calendar} label="Allocated days" value={String(balance?.allocatedDays ?? "—")} />
        <StatCard icon={CalendarCheck} label="Used days" value={String(balance?.usedDays ?? "—")} />
        <StatCard icon={CalendarClock} label="Remaining days" value={String(balance?.remainingDays ?? "—")} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar events={calendarEvents} />
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-text-muted">
              <LegendDot color="warning" label="Your pending request" />
              <LegendDot color="primary" label="Your approved request" />
              <LegendDot color="info" label="Team approved leave" />
              <LegendDot color="success" label="Holiday" />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="requests">
              <TabsList>
                <TabsTrigger value="requests">My requests</TabsTrigger>
                {canApprove && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                <DataTable
                  columns={getLeaveRequestColumns()}
                  data={requests ?? []}
                  loading={requestsLoading}
                  emptyTitle="No leave requests yet"
                  pageSize={6}
                />
              </TabsContent>

              {canApprove && (
                <TabsContent value="approvals">
                  {(teamPending ?? []).length === 0 ? (
                    <EmptyState title="No pending requests" description="Your direct reports have nothing awaiting approval." />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(teamPending ?? []).map((entry) => (
                        <div
                          key={entry.requestId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={entry.employeeName} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-text">{entry.employeeName}</p>
                              <p className="text-xs text-text-muted">
                                {typeLabel[entry.type]} · {new Date(entry.startDate).toLocaleDateString()} –{" "}
                                {new Date(entry.endDate).toLocaleDateString()} · {entry.days}d
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              intent="secondary"
                              onClick={async () => {
                                await updateStatus.mutateAsync({ id: entry.requestId, status: "rejected" });
                                push({ title: "Request rejected", tone: "info" });
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await updateStatus.mutateAsync({ id: entry.requestId, status: "approved" });
                                push({ title: "Request approved", tone: "success" });
                              }}
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="holidays">
                <div className="mb-3 flex justify-end">
                  {canManageHolidays && (
                    <Button size="sm" onClick={() => setAddingHoliday(true)}>
                      New holiday
                    </Button>
                  )}
                </div>
                {holidaysLoading ? null : (holidays ?? []).length === 0 ? (
                  <EmptyState title="No holidays configured" />
                ) : (
                  <div className="flex flex-col gap-2">
                    {(holidays ?? []).map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge tone="info">{new Date(holiday.date).toLocaleDateString()}</Badge>
                          <p className="text-sm text-text">{holiday.name}</p>
                        </div>
                        {canManageHolidays && (
                          <Button
                            size="sm"
                            intent="ghost"
                            aria-label="Delete holiday"
                            onClick={async () => {
                              await deleteHoliday.mutateAsync(holiday.id);
                              push({ title: "Holiday removed", tone: "success" });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {requesting && (
        <LeaveRequestDialog
          onClose={() => setRequesting(false)}
          onSubmit={async (values) => {
            await createRequest.mutateAsync({
              type: values.type,
              startDate: values.startDate.toISOString().slice(0, 10),
              endDate: values.endDate.toISOString().slice(0, 10),
              reason: values.reason || undefined,
            });
            push({ title: "Time off requested", tone: "success" });
          }}
        />
      )}

      {addingHoliday && (
        <HolidayFormDialog
          onClose={() => setAddingHoliday(false)}
          onSubmit={async (values) => {
            await createHoliday.mutateAsync({ name: values.name, date: values.date.toISOString().slice(0, 10) });
            push({ title: "Holiday added", tone: "success" });
          }}
        />
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: MiniCalendarEvent["color"]; label: string }) {
  const dotClass = { primary: "bg-primary", warning: "bg-warning", info: "bg-info", success: "bg-success" }[color];
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${dotClass}`} />
      {label}
    </div>
  );
}
