"use client";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, SubmitButton } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { SERVICE_ICON_OPTIONS } from "@/components/shared/icon";
import { useServerAction } from "@/hooks/use-action";
import { saveService, type ServiceInput } from "../actions";

export function ServiceForm({ id, service, currency }: { id?: string; service?: Partial<ServiceInput>; currency: string }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<ServiceInput>({
    defaultValues: { name: "", slug: "", category: "Engineering", summary: "", description: "", icon: "globe", starting_price: "", delivery_time: "", deliverables: "", features: "", is_active: true, is_public: true, sort_order: 0, ...service },
  });
  const r = form.register;
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveService(id ?? null, v), { onSuccess: () => close?.() }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input {...r("name")} />
        </Field>
        <Field label="URL slug" hint="Leave empty to generate from the name.">
          <Input {...r("slug")} />
        </Field>
        <Field label="Category">
          <Input {...r("category")} />
        </Field>
        <Field label="Icon">
          <NativeSelect {...r("icon")}>
            {SERVICE_ICON_OPTIONS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={`Starting price (${currency})`}>
          <Input inputMode="decimal" {...r("starting_price")} />
        </Field>
        <Field label="Typical delivery time">
          <Input {...r("delivery_time")} placeholder="4–8 weeks" />
        </Field>
      </div>
      <Field label="Summary" hint="One line, shown in lists.">
        <Input {...r("summary")} />
      </Field>
      <Field label="Description">
        <Textarea rows={3} {...r("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deliverables" hint="One per line.">
          <Textarea rows={4} {...r("deliverables")} />
        </Field>
        <Field label="Features" hint="One per line.">
          <Textarea rows={4} {...r("features")} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("is_active") === true} onCheckedChange={(v) => form.setValue("is_active", v === true)} /> Active
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={form.watch("is_public") === true} onCheckedChange={(v) => form.setValue("is_public", v === true)} /> Shown on website
        </label>
        <label className="flex items-center gap-2">
          Order <Input type="number" className="h-8 w-20" {...r("sort_order")} />
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save service</SubmitButton>
      </div>
    </form>
  );
}
