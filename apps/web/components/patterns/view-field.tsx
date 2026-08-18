import type { FieldConfig } from "@/lib/forms/field-config";
import { formatFieldValue } from "@/lib/forms/field-config";

export function ViewField({ field, value }: { field: FieldConfig; value: unknown }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-muted">{field.label}</span>
      <span className="text-sm text-text">{formatFieldValue(field, value)}</span>
    </div>
  );
}
