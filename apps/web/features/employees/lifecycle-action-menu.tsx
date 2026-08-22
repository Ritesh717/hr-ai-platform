"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import type { Employee } from "@/lib/api/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  employee: Employee;
  onViewProfile: () => void;
}

export function LifecycleActionMenu({ employee, onViewProfile }: Props) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const isActive = employee.status === "active";
  const isTerminated = employee.status === "terminated";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="ghost" size="sm" className="size-8 p-0">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Actions for {employee.fullName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onViewProfile}>
            <Eye className="size-4" /> View profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="size-4" /> Transfer
          </DropdownMenuItem>
          {isTerminated && (
            <DropdownMenuItem>
              <UserCheck className="size-4" /> Re-onboard
            </DropdownMenuItem>
          )}
          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOffboardOpen(true)}
                className="text-warning"
              >
                <UserMinus className="size-4" /> Offboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeactivateOpen(true)}
                className="text-danger"
              >
                <UserX className="size-4" /> Deactivate
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Transfer dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogTitle>Transfer {employee.fullName}</DialogTitle>
          <DialogDescription>
            Move this employee to a new department and/or reporting line.
          </DialogDescription>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>New department</Label>
              <Input placeholder="Search departments…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>New manager</Label>
              <Input placeholder="Search managers…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Effective date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => setTransferOpen(false)}>Confirm transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offboard dialog */}
      <Dialog open={offboardOpen} onOpenChange={setOffboardOpen}>
        <DialogContent>
          <DialogTitle>Offboard {employee.fullName}</DialogTitle>
          <DialogDescription>
            Record the departure of this employee. Their status will be updated to Offboarded.
          </DialogDescription>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Last working day</Label>
              <Input type="date" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Departure reason</Label>
              <Textarea
                placeholder="e.g. Resignation, Redundancy, End of contract…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="ghost">Cancel</Button>
            </DialogClose>
            <Button intent="destructive" onClick={() => setOffboardOpen(false)}>
              Confirm offboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogTitle>Deactivate {employee.fullName}?</DialogTitle>
          <DialogDescription>
            This employee will lose platform access immediately. You can reactivate
            the account at any time.
          </DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button intent="ghost">Cancel</Button>
            </DialogClose>
            <Button intent="destructive" onClick={() => setDeactivateOpen(false)}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
