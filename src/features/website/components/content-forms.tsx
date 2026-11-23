"use client";
import { useForm } from "react-hook-form";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { useServerAction } from "@/hooks/use-action";
import { createUploadTarget, registerFile } from "@/features/files/actions";
import { deleteContent, saveContent, type FaqFormInput, type PortfolioFormInput, type TestimonialFormInput } from "../actions";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} /> {label}
    </label>
  );
}

export function PortfolioForm({ id, item }: { id?: string; item?: Partial<PortfolioFormInput> }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<PortfolioFormInput>({
    defaultValues: { title: "", slug: "", client_name: "", industry: "", year: "", summary: "", challenge: "", solution: "", results: "", metrics: "", cover_image_url: "", services: "", tech_stack: "", project_url: "", is_published: false, is_featured: false, sort_order: 0, ...item },
  });
  const r = form.register;
  const cover = form.watch("cover_image_url");
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveContent("portfolio_items", id ?? null, v), { onSuccess: () => close?.(), onError: (x) => applyFieldErrors(form, x.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <Input {...r("title")} />
        </Field>
        <Field label="Client name">
          <Input {...r("client_name")} />
        </Field>
        <Field label="Industry">
          <Input {...r("industry")} />
        </Field>
        <Field label="Year">
          <Input type="number" {...r("year")} />
        </Field>
        <Field label="Project URL">
          <Input {...r("project_url")} />
        </Field>
      </div>
      <Field label="Summary">
        <Input {...r("summary")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Challenge">
          <Textarea rows={4} {...r("challenge")} />
        </Field>
        <Field label="Approach">
          <Textarea rows={4} {...r("solution")} />
        </Field>
        <Field label="Results">
          <Textarea rows={4} {...r("results")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Metrics" hint="One per line: Label | Value">
          <Textarea rows={3} {...r("metrics")} placeholder={"Conversion | +38%"} />
        </Field>
        <Field label="Services" hint="One per line">
          <Textarea rows={3} {...r("services")} />
        </Field>
        <Field label="Tech stack" hint="One per line">
          <Textarea rows={3} {...r("tech_stack")} />
        </Field>
      </div>
      <Field label="Cover image" hint="Optional. Without one, a typographic cover is generated.">
        {cover ? (
          <div className="flex items-center gap-3 text-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(cover)} alt="" className="h-14 w-20 rounded object-cover" />
            <Button type="button" variant="outline" size="sm" onClick={() => form.setValue("cover_image_url", "")}>
              Remove
            </Button>
          </div>
        ) : (
          <FileUploader
            compact
            multiple={false}
            accept="image/*"
            label="Upload cover image"
            createTarget={(f) => createUploadTarget({ scope: "public" }, f)}
            register={async (t, file) => {
              const res = await registerFile({ bucket: "public-assets", path: t.path, name: file.name });
              if (res.ok && res.data.publicUrl) form.setValue("cover_image_url", res.data.publicUrl);
              return res;
            }}
          />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-5">
        <Toggle label="Published" checked={form.watch("is_published") === true} onChange={(v) => form.setValue("is_published", v)} />
        <Toggle label="Featured on homepage" checked={form.watch("is_featured") === true} onChange={(v) => form.setValue("is_featured", v)} />
        <label className="flex items-center gap-2 text-sm">
          Order <Input type="number" className="h-8 w-20" {...r("sort_order")} />
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save case study</SubmitButton>
      </div>
    </form>
  );
}

export function TestimonialForm({ id, item }: { id?: string; item?: Partial<TestimonialFormInput> }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<TestimonialFormInput>({ defaultValues: { author_name: "", author_title: "", company: "", quote: "", rating: 5, is_published: false, sort_order: 0, ...item } });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveContent("testimonials", id ?? null, v), { onSuccess: () => close?.() }))}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" required>
          <Input {...form.register("author_name")} />
        </Field>
        <Field label="Title">
          <Input {...form.register("author_title")} />
        </Field>
        <Field label="Company">
          <Input {...form.register("company")} />
        </Field>
      </div>
      <Field label="Quote" required>
        <Textarea rows={4} {...form.register("quote")} />
      </Field>
      <div className="flex items-center gap-5">
        <Toggle label="Published" checked={form.watch("is_published") === true} onChange={(v) => form.setValue("is_published", v)} />
        <label className="flex items-center gap-2 text-sm">
          Rating <Input type="number" min={1} max={5} className="h-8 w-16" {...form.register("rating")} />
        </label>
      </div>
      <p className="text-[12px] text-muted-foreground">Only publish testimonials you have permission to use.</p>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save</SubmitButton>
      </div>
    </form>
  );
}

export function FaqForm({ id, item }: { id?: string; item?: Partial<FaqFormInput> }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<FaqFormInput>({ defaultValues: { question: "", answer: "", category: "general", is_published: true, sort_order: 0, ...item } });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveContent("faqs", id ?? null, v), { onSuccess: () => close?.() }))}>
      <Field label="Question" required>
        <Input {...form.register("question")} />
      </Field>
      <Field label="Answer" required>
        <Textarea rows={4} {...form.register("answer")} />
      </Field>
      <div className="flex items-center gap-5">
        <Toggle label="Published" checked={form.watch("is_published") === true} onChange={(v) => form.setValue("is_published", v)} />
        <label className="flex items-center gap-2 text-sm">
          Order <Input type="number" className="h-8 w-20" {...form.register("sort_order")} />
        </label>
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteContentButton({ table, id }: { table: "portfolio_items" | "testimonials" | "faqs"; id: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Delete" onClick={() => confirm("Delete this item?") && execute(() => deleteContent(table, id))}>
      <Trash />
    </Button>
  );
}
