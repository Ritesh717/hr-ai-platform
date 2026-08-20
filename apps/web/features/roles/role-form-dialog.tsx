"use client";

import { useState } from "react";
import { usePermissions } from "@/features/roles/api";
import type { PermissionCode, Role } from "@/lib/api/types";
import type { RoleInput } from "@/lib/api/roles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Bespoke rather than the generic Form/FieldConfig pattern — permission selection is a
 * checkbox-group over a dynamic catalog, which FieldConfig doesn't model.
 *
 * Callers must mount this only while the dialog should be open (and unmount on close), keyed by
 * the role's id (or a constant like "create" for the create case) — that's what gives each
 * open a fresh, correctly-initialized local state without a reset-on-open effect.
 */
export function RoleFormDialog({
  role,
  onClose,
  onSubmit,
}: {
  role?: Role;
  onClose: () => void;
  onSubmit: (input: RoleInput) => Promise<void>;
}) {
  const { data: permissions } = usePermissions();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<PermissionCode>>(new Set(role?.permissions ?? []));
  const [submitting, setSubmitting] = useState(false);

  function toggle(code: PermissionCode) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({ name, description: description || undefined, permissionCodes: [...selected] });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogTitle>{role ? "Edit role" : "New role"}</DialogTitle>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Permissions</Label>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {(permissions ?? []).map((permission) => {
                const inputId = `permission-${permission.code}`;
                return (
                  <div key={permission.code} className="flex items-center gap-2">
                    <Checkbox
                      id={inputId}
                      checked={selected.has(permission.code)}
                      onCheckedChange={() => toggle(permission.code)}
                    />
                    <Label htmlFor={inputId} className="cursor-pointer font-normal">
                      {permission.code}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button intent="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={submitting} disabled={!name.trim()} onClick={handleSubmit}>
            {role ? "Save changes" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
