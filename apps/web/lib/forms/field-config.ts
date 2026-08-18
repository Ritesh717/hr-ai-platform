export type FieldType = "text" | "email" | "textarea" | "select" | "date" | "checkbox";

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  options?: SelectFieldOption[];
}

/** Renders any value the way a ViewField/DataTable cell should display it. */
export function formatFieldValue(field: FieldConfig, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "date" && value instanceof Date) return value.toLocaleDateString();
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "select") {
    return field.options?.find((option) => option.value === value)?.label ?? String(value);
  }
  return String(value);
}
