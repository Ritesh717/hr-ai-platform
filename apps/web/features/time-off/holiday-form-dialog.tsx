"use client";

import { holidayCreateFields, holidayCreateSchema } from "@/features/time-off/schema";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/patterns/form";

export function HolidayFormDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: ReturnType<typeof holidayCreateSchema.parse>) => Promise<void>;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>New holiday</DialogTitle>
        <div className="mt-4">
          <Form
            schema={holidayCreateSchema}
            fields={holidayCreateFields}
            defaultValues={{ name: "", date: new Date() }}
            submitLabel="Add holiday"
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
