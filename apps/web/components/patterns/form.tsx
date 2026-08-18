"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import type { z } from "zod";
import type { FieldConfig } from "@/lib/forms/field-config";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/patterns/form-field";

export function Form<TSchema extends z.ZodType>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  className,
}: {
  schema: TSchema;
  fields: FieldConfig[];
  defaultValues: z.infer<TSchema>;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}) {
  const methods = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { handleSubmit, formState } = methods;

  return (
    <FormProvider {...methods}>
      <form
        className={className}
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
              <FormField field={field} />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {onCancel && (
            <Button type="button" intent="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={formState.isSubmitting} disabled={!formState.isDirty}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
