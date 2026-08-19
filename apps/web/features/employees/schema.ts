import { z } from "zod";
import type { Department } from "@/lib/api/types";
import type { FieldConfig } from "@/lib/forms/field-config";

// Radix's Select.Item rejects an empty-string value (reserved to mean "clear
// selection"), so "no department" needs a real sentinel — translated back to
// null at the API boundary in employee-detail-screen.tsx.
export const NO_DEPARTMENT = "none";

// Email isn't editable: domain/employee/schemas.py::EmployeeUpdate has no email field
// (changing an employee's login email isn't part of this API) — it's shown read-only
// in the detail screen header instead, alongside role.
export const employeeProfileSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  departmentId: z.string(), // NO_DEPARTMENT sentinel means no department
  status: z.enum(["active", "on_leave", "terminated"]),
  location: z.string(),
  hireDate: z.date(),
});

export type EmployeeProfileValues = z.infer<typeof employeeProfileSchema>;

/**
 * Drives both Form (edit) and ViewOnlyForm (view) — same field list, same
 * order, so toggling modes never shifts the layout (ui-plan.md §4.2). A
 * function (not a static array) because the department options come from
 * the real, per-tenant department list, not a fixed set.
 */
export function getEmployeeProfileFields(departments: Department[]): FieldConfig[] {
  return [
    { name: "fullName", label: "Full name", type: "text" },
    { name: "jobTitle", label: "Job title", type: "text" },
    {
      name: "departmentId",
      label: "Department",
      type: "select",
      options: [
        { value: NO_DEPARTMENT, label: "No department" },
        ...departments.map((department) => ({ value: department.id, label: department.name })),
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "on_leave", label: "On leave" },
        { value: "terminated", label: "Terminated" },
      ],
    },
    { name: "location", label: "Location", type: "text" },
    { name: "hireDate", label: "Hire date", type: "date" },
  ];
}
