import type { FieldConfig } from "@/lib/forms/field-config";
import { ViewField } from "@/components/patterns/view-field";

export function ViewOnlyForm({
  fields,
  values,
  className,
}: {
  fields: FieldConfig[];
  values: Record<string, unknown>;
  className?: string;
}) {
  return (
    <div className={className ?? "grid grid-cols-1 gap-5 sm:grid-cols-2"}>
      {fields.map((field) => (
        <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
          <ViewField field={field} value={values[field.name]} />
        </div>
      ))}
    </div>
  );
}
