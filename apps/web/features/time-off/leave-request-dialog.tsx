"use client";

import { leaveRequestCreateFields, leaveRequestCreateSchema } from "@/features/time-off/schema";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/patterns/form";

// Caller mounts this only while the dialog should be open — see employee-create-dialog.tsx for
// why (fresh Form instance per open, no reset-on-open effect).
export function LeaveRequestDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: ReturnType<typeof leaveRequestCreateSchema.parse>) => Promise<void>;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Request time off</DialogTitle>
        <div className="mt-4">
          <Form
            schema={leaveRequestCreateSchema}
            fields={leaveRequestCreateFields}
            defaultValues={{ type: "vacation", startDate: new Date(), endDate: new Date(), reason: "" }}
            submitLabel="Submit request"
            onCancel={onClose}
            onSubmit={async (values) => {
              await onSubmit(values);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
