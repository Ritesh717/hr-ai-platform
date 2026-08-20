"use client";

import { useRoles } from "@/features/roles/api";
import { NO_DEPARTMENT, employeeCreateSchema, getEmployeeCreateFields } from "@/features/employees/schema";
import type { Department } from "@/lib/api/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/patterns/form";

// Caller mounts this only while the dialog should be open (and unmounts on close) — gives each
// open a fresh Form instance (react-hook-form only reads defaultValues at mount).
export function EmployeeCreateDialog({
  departments,
  onClose,
  onSubmit,
}: {
  departments: Department[];
  onClose: () => void;
  onSubmit: (values: ReturnType<typeof employeeCreateSchema.parse>) => Promise<void>;
}) {
  const { data: roles } = useRoles();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogTitle>New employee</DialogTitle>
        <div className="mt-4">
          <Form
            schema={employeeCreateSchema}
            fields={getEmployeeCreateFields(departments, roles ?? [])}
            defaultValues={{
              fullName: "",
              email: "",
              password: "",
              jobTitle: "",
              roleId: "",
              departmentId: NO_DEPARTMENT,
              hireDate: new Date(),
              location: "",
            }}
            submitLabel="Create employee"
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
