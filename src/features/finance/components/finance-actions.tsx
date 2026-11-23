"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Ban, Banknote, Pencil, Send, Trash } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { FormDialog, useDialogClose } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { FileUploader } from "@/components/shared/file-uploader";
import { useServerAction } from "@/hooks/use-action";
import { cancelInvoice, deleteDraftInvoice, deleteExpense, recordPayment, saveExpense, sendInvoice, setPaymentStatus } from "../actions";
import { createUploadTarget, registerFile } from "@/features/files/actions";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/status";
import type { ExpenseInput, PaymentInput } from "../schemas";

export function InvoiceActions({ id, status, balance, currency, amountPaid }: { id: string; status: string; balance: string; currency: string; amountPaid: number }) {
  const router = useRouter();
  return (
    <>
      {amountPaid === 0 && status !== "cancelled" && status !== "paid" ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/finance/invoices/${id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      ) : null}
      {status === "draft" ? (
        <ConfirmAction trigger={<Button size="sm"><Send /> Issue & send</Button>} title="Issue this invoice?" description="The client is notified by email and in their portal. Line items stay editable until a payment is recorded." confirmLabel="Issue invoice" action={() => sendInvoice(id)} />
      ) : null}
      {["sent", "partially_paid", "overdue"].includes(status) ? (
        <FormDialog title="Record payment" description="Record money actually received. The invoice balance and status update automatically." trigger={<Button size="sm"><Banknote /> Record payment</Button>}>
          <PaymentForm invoiceId={id} balance={balance} currency={currency} />
        </FormDialog>
      ) : null}
      {status !== "draft" && status !== "cancelled" && amountPaid === 0 ? (
        <ConfirmAction trigger={<Button size="sm" variant="ghost"><Ban /> Cancel</Button>} title="Cancel this invoice?" description="Cancelled invoices are kept for your records but no longer count as receivables." destructive confirmLabel="Cancel invoice" action={() => cancelInvoice(id)} />
      ) : null}
      {status === "draft" ? (
        <ConfirmAction trigger={<Button size="icon-sm" variant="ghost" aria-label="Delete draft"><Trash /></Button>} title="Delete this draft?" destructive confirmLabel="Delete" action={() => deleteDraftInvoice(id)} onDone={() => router.push("/admin/finance/invoices")} />
      ) : null}
    </>
  );
}

function PaymentForm({ invoiceId, balance, currency }: { invoiceId: string; balance: string; currency: string }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  // A stable idempotency key per open dialog prevents double-recording on double submit.
  const key = useMemo(() => crypto.randomUUID(), []);
  const form = useForm<PaymentInput>({
    defaultValues: { invoice_id: invoiceId, amount: balance, payment_date: new Date().toISOString().slice(0, 10), method: "bank_transfer", reference: "", notes: "", idempotency_key: key },
  });
  const e = form.formState.errors;
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => recordPayment(v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Amount (${currency})`} error={e.amount?.message} hint={`Outstanding: ${balance}`}>
          <Input inputMode="decimal" {...form.register("amount")} />
        </Field>
        <Field label="Date received" error={e.payment_date?.message}>
          <Input type="date" {...form.register("payment_date")} />
        </Field>
        <Field label="Method">
          <NativeSelect {...form.register("method")}>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Transaction reference">
          <Input {...form.register("reference")} />
        </Field>
      </div>
      <Field label="Notes">
        <Input {...form.register("notes")} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Record payment</SubmitButton>
      </div>
    </form>
  );
}

export function PaymentStatusSelect({ id, status }: { id: string; status: string }) {
  const { execute, pending } = useServerAction();
  return (
    <NativeSelect aria-label="Payment status" className="h-7 w-32 text-[12px]" value={status} disabled={pending} onChange={(e) => execute(() => setPaymentStatus(id, e.target.value as "completed"))}>
      <option value="completed">Completed</option>
      <option value="refunded">Refunded</option>
      <option value="failed">Failed</option>
    </NativeSelect>
  );
}

export function ExpenseForm({ id, expense, currency, projects }: { id?: string; expense?: Partial<ExpenseInput>; currency: string; projects: { id: string; name: string }[] }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const [receipt, setReceipt] = useState<string | null>(null);
  const form = useForm<ExpenseInput>({ defaultValues: { category: "software", description: "", amount: "", expense_date: new Date().toISOString().slice(0, 10), vendor: "", project_id: "", receipt_file_id: "", ...expense } });
  const e = form.formState.errors;
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveExpense(id ?? null, v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description" error={e.description?.message} className="sm:col-span-2">
          <Input {...form.register("description")} />
        </Field>
        <Field label={`Amount (${currency})`} error={e.amount?.message}>
          <Input inputMode="decimal" {...form.register("amount")} />
        </Field>
        <Field label="Date">
          <Input type="date" {...form.register("expense_date")} />
        </Field>
        <Field label="Category">
          <NativeSelect {...form.register("category")}>
            {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Vendor">
          <Input {...form.register("vendor")} />
        </Field>
        <Field label="Project (optional)" hint="Counts against project profitability." className="sm:col-span-2">
          <NativeSelect {...form.register("project_id")}>
            <option value="">Overhead (no project)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Receipt">
        {receipt || expense?.receipt_file_id ? (
          <p className="text-[13px] text-muted-foreground">Receipt attached.</p>
        ) : (
          <FileUploader
            compact
            multiple={false}
            accept="image/*,application/pdf"
            label="Upload receipt (PDF or image, max 20 MB)"
            createTarget={(f) => createUploadTarget({ scope: "finance", category: "receipt" }, f)}
            register={async (t, file) => {
              const r = await registerFile({ bucket: "finance-files", path: t.path, name: file.name, category: "receipt" });
              if (r.ok && r.data.id) {
                setReceipt(r.data.id);
                form.setValue("receipt_file_id", r.data.id);
              }
              return r;
            }}
          />
        )}
      </Field>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save expense</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteExpenseButton({ id }: { id: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Delete expense" onClick={() => confirm("Delete this expense?") && execute(() => deleteExpense(id))}>
      <Trash />
    </Button>
  );
}
