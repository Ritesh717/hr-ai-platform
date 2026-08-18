import { z } from "zod";
import type { FieldConfig } from "@/lib/forms/field-config";

export const employeeProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  status: z.enum(["active", "on_leave", "terminated"]),
  location: z.string().min(1, "Location is required"),
  hireDate: z.date(),
  bio: z.string().optional(),
});

export type EmployeeProfileValues = z.infer<typeof employeeProfileSchema>;

/**
 * Drives both Form (edit) and ViewOnlyForm (view) — same field list, same
 * order, so toggling modes never shifts the layout (ui-plan.md §4.2).
 */
export const employeeProfileFields: FieldConfig[] = [
  { name: "name", label: "Full name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "jobTitle", label: "Job title", type: "text" },
  {
    name: "department",
    label: "Department",
    type: "select",
    options: [
      { value: "Engineering", label: "Engineering" },
      { value: "Design", label: "Design" },
      { value: "Sales", label: "Sales" },
      { value: "People", label: "People" },
      { value: "Finance", label: "Finance" },
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
  { name: "bio", label: "Bio", type: "textarea" },
];
