"use client";

import { useState } from "react";
import { useUpdateLeaveRequest, useUpdateLeaveStatus } from "@/features/time-off/api";
import { leaveRequestCreateFields, leaveRequestCreateSchema } from "@/features/time-off/schema";
import type { LeaveTeamEntry } from "@/lib/api/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Form } from "@/components/patterns/form";

const statusTone = { pending: "warning", approved: "success", rejected: "danger" } as const;
const typeLabel = { vacation: "Vacation", sick: "Sick", personal: "Personal" } as const;

// Mounted only while a calendar entry is selected — see leave-request-dialog.tsx for why (fresh
// instance per open). Caller passes key={entry.requestId} so switching entries resets `mode`.
export function LeaveDetailDialog({
  entry,
  viewerEmployeeId,
  canApprove,
  onClose,
}: {
  entry: LeaveTeamEntry;
  viewerEmployeeId: string;
  canApprove: boolean;
  onClose: () => void;
}) {
  const push = useToast();
  const updateStatus = useUpdateLeaveStatus();
  const updateRequest = useUpdateLeaveRequest();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [comment, setComment] = useState("");

  const isOwnRequest = entry.employeeId === viewerEmployeeId;
  const isPending = entry.status === "pending";
  // "My Team" is direct-reports-only, so a viewer never sees their own request through this
  // modal in practice — isOwnRequest is kept explicit anyway so Edit can never appear next to a
  // request that isn't the viewer's own, regardless of where this dialog is mounted from.
  const showApproveReject = isPending && canApprove && !isOwnRequest;
  const showEdit = isPending && isOwnRequest;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <div className="flex items-start justify-between gap-2">
          <DialogTitle>Leave request</DialogTitle>
          {showEdit && mode === "view" && (
            <Button size="sm" intent="secondary" onClick={() => setMode("edit")}>
              Edit
            </Button>
          )}
        </div>

        {mode === "edit" ? (
          <div className="mt-4">
            <Form
              schema={leaveRequestCreateSchema}
              fields={leaveRequestCreateFields}
              defaultValues={{
                type: entry.type,
                startDate: new Date(entry.startDate),
                endDate: new Date(entry.endDate),
                reason: entry.reason ?? "",
              }}
              submitLabel="Save changes"
              onCancel={() => setMode("view")}
              onSubmit={async (values) => {
                await updateRequest.mutateAsync({
                  id: entry.requestId,
                  input: {
                    type: values.type,
                    startDate: values.startDate.toISOString().slice(0, 10),
                    endDate: values.endDate.toISOString().slice(0, 10),
                    reason: values.reason || undefined,
                  },
                });
                push({ title: "Request updated", tone: "success" });
                onClose();
              }}
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={entry.employeeName} size="md" />
              <div>
                <p className="text-sm font-medium text-text">{entry.employeeName}</p>
                <p className="text-xs text-text-muted">
                  {typeLabel[entry.type]} · {new Date(entry.startDate).toLocaleDateString()} –{" "}
                  {new Date(entry.endDate).toLocaleDateString()} · {entry.days}d
                </p>
              </div>
              <Badge tone={statusTone[entry.status]} className="ml-auto">
                {entry.status}
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Reason</p>
              <p className="mt-1 text-sm text-text">{entry.reason ?? "—"}</p>
            </div>

            {entry.approverComment && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Approver comment</p>
                <p className="mt-1 text-sm text-text">{entry.approverComment}</p>
              </div>
            )}

            {showApproveReject && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <div>
                  <Label htmlFor="approver-comment">Comment (optional)</Label>
                  <Textarea
                    id="approver-comment"
                    className="mt-1.5"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    intent="secondary"
                    loading={updateStatus.isPending}
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: entry.requestId,
                        status: "rejected",
                        comment: comment || undefined,
                      });
                      push({ title: "Request rejected", tone: "info" });
                      onClose();
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    loading={updateStatus.isPending}
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: entry.requestId,
                        status: "approved",
                        comment: comment || undefined,
                      });
                      push({ title: "Request approved", tone: "success" });
                      onClose();
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
