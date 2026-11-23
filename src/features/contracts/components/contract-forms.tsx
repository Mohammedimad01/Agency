"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { useServerAction } from "@/hooks/use-action";
import { addContractVersion, saveContract } from "@/features/finance/actions";
import { createUploadTarget, registerFile } from "@/features/files/actions";
import { CONTRACT_STATUSES } from "@/lib/status";
import type { ContractInput } from "@/features/finance/schemas";

export function ContractForm({ id, contract, currency, clients, projects }: { id?: string; contract?: Partial<ContractInput>; currency: string; clients: { id: string; name: string }[]; projects: { id: string; name: string; client_id: string }[] }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm<ContractInput>({
    defaultValues: { client_id: "", project_id: "", title: "", description: "", status: "draft", value: "", start_date: "", end_date: "", signed_by_name: "", signed_at: "", notes: "", ...contract },
  });
  const e = form.formState.errors;
  const clientId = form.watch("client_id");
  const status = form.watch("status");
  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((v) => execute(() => saveContract(id ?? null, v), { onSuccess: (d) => { close?.(); if (!id) router.push(`/admin/contracts/${d.id}`); }, onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}
    >
      <Field label="Title" error={e.title?.message} required>
        <Input {...form.register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" error={e.client_id?.message} required>
          <NativeSelect {...form.register("client_id")}>
            <option value="">Select…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Project">
          <NativeSelect {...form.register("project_id")}>
            <option value="">—</option>
            {projects.filter((p) => p.client_id === clientId).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status">
          <NativeSelect {...form.register("status")}>
            {Object.entries(CONTRACT_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={`Value (${currency})`} error={e.value?.message}>
          <Input inputMode="decimal" {...form.register("value")} />
        </Field>
        <Field label="Start date">
          <Input type="date" {...form.register("start_date")} />
        </Field>
        <Field label="Expiry / end date">
          <Input type="date" {...form.register("end_date")} />
        </Field>
        {status === "signed" || status === "active" ? (
          <>
            <Field label="Signed by">
              <Input {...form.register("signed_by_name")} />
            </Field>
            <Field label="Signing date">
              <Input type="date" {...form.register("signed_at")} />
            </Field>
          </>
        ) : null}
      </div>
      <Field label="Description">
        <Textarea rows={2} {...form.register("description")} />
      </Field>
      <Field label="Internal notes">
        <Textarea rows={2} {...form.register("notes")} />
      </Field>
      <p className="text-[12px] text-muted-foreground">
        This platform records uploaded signed documents and client acceptance. It does not create legally binding e-signatures; use a compliant signature provider if you need one.
      </p>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save contract</SubmitButton>
      </div>
    </form>
  );
}

export function ContractVersionUploader({ contractId }: { contractId: string }) {
  const router = useRouter();
  return (
    <FileUploader
      multiple={false}
      accept="application/pdf,image/*"
      label="Upload a new version (PDF)"
      hint="Uploaded versions are shared with the client in their portal."
      createTarget={(f) => createUploadTarget({ scope: "finance", category: "contract" }, f)}
      register={async (t, file) => {
        const r = await registerFile({ bucket: "finance-files", path: t.path, name: file.name, category: "contract", visibility: "client" });
        if (!r.ok || !r.data.id) return r;
        return addContractVersion(contractId, r.data.id);
      }}
      onComplete={() => router.refresh()}
    />
  );
}
