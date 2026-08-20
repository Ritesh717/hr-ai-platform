"use client";

import { useState } from "react";
import type { Department } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Callers must mount this only while the dialog should be open (and unmount on close), keyed by
 * the department's id (or a constant like "create") — gives each open fresh local state without
 * a reset-on-open effect.
 */
export function DepartmentFormDialog({
  department,
  onClose,
  onSubmit,
}: {
  department?: Department;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(name);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{department ? "Rename department" : "New department"}</DialogTitle>
        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="department-name">Name</Label>
          <Input id="department-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <DialogFooter>
          <Button intent="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={submitting} disabled={!name.trim()} onClick={handleSubmit}>
            {department ? "Save changes" : "Create department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
