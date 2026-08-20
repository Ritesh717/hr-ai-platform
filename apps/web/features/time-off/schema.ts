import { z } from "zod";
import type { FieldConfig } from "@/lib/forms/field-config";

export const leaveRequestCreateSchema = z
  .object({
    type: z.enum(["vacation", "sick", "personal"]),
    startDate: z.date(),
    endDate: z.date(),
    reason: z.string(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date must not be before start date",
    path: ["endDate"],
  });

export type LeaveRequestCreateValues = z.infer<typeof leaveRequestCreateSchema>;

export const leaveRequestCreateFields: FieldConfig[] = [
  {
    name: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "vacation", label: "Vacation" },
      { value: "sick", label: "Sick" },
      { value: "personal", label: "Personal" },
    ],
  },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "reason", label: "Reason (optional)", type: "textarea" },
];

export const holidayCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.date(),
});

export type HolidayCreateValues = z.infer<typeof holidayCreateSchema>;

export const holidayCreateFields: FieldConfig[] = [
  { name: "name", label: "Holiday name", type: "text" },
  { name: "date", label: "Date", type: "date" },
];
