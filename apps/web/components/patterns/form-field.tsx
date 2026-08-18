"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { FieldConfig } from "@/lib/forms/field-config";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function FormField({ field }: { field: FieldConfig }) {
  const { control, formState } = useFormContext();
  const error = formState.errors[field.name]?.message as string | undefined;
  const inputId = `field-${field.name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{field.label}</Label>
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => {
          switch (field.type) {
            case "textarea":
              return (
                <Textarea
                  id={inputId}
                  placeholder={field.placeholder}
                  invalid={!!error}
                  {...rhf}
                />
              );
            case "select":
              return (
                <Select value={rhf.value ?? ""} onValueChange={rhf.onChange}>
                  <SelectTrigger id={inputId}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            case "date":
              return (
                <DatePicker
                  value={rhf.value ?? null}
                  onChange={(date) => rhf.onChange(date ?? null)}
                  placeholder={field.placeholder}
                />
              );
            case "checkbox":
              return (
                <Checkbox
                  id={inputId}
                  checked={!!rhf.value}
                  onCheckedChange={rhf.onChange}
                />
              );
            default:
              return (
                <Input
                  id={inputId}
                  type={field.type}
                  placeholder={field.placeholder}
                  invalid={!!error}
                  {...rhf}
                />
              );
          }
        }}
      />
      {field.helpText && !error && (
        <p className="text-xs text-text-muted">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
