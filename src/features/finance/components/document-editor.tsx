"use client";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { GripVertical, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { calcTotals, type DiscountType } from "@/lib/finance/calculations";
import { minorToInput, parseToMinor } from "@/lib/finance/money";
import { formatMoney } from "@/lib/format";
import { saveProposal } from "@/features/proposals/actions";
import { saveInvoice } from "../actions";

type Opt = { id: string; name: string };
type ServiceOpt = Opt & { starting_price_cents: number | null };

export interface EditorItem {
  service_id: string;
  description: string;
  details: string;
  quantity: string;
  unit_price: string;
}

export interface EditorValues {
  client_id: string;
  lead_id: string;
  project_id: string;
  title: string;
  summary: string;
  scope: string;
  timeline: string;
  payment_terms: string;
  valid_until: string;
  issue_date: string;
  due_date: string;
  notes: string;
  discount_type: DiscountType;
  discount_value: string;
  tax_rate: string;
  items: EditorItem[];
}

function safeMinor(v: string, currency: string) {
  try {
    return Number(parseToMinor(v || "0", currency));
  } catch {
    return 0;
  }
}

function Totals({ control, currency }: { control: Control<EditorValues>; currency: string }) {
  const [items, discountType, discountValue, taxRate] = useWatch({ control, name: ["items", "discount_type", "discount_value", "tax_rate"] });
  let totals = { subtotalCents: 0, discountCents: 0, taxCents: 0, totalCents: 0 };
  try {
    const lines = (items ?? []).filter((i) => /^\d+(\.\d{1,2})?$/.test(String(i.quantity).trim())).map((i) => ({ quantity: i.quantity, unitPriceCents: safeMinor(i.unit_price, currency) }));
    const dv = discountType === "percent" ? Math.round(Number(discountValue || 0) * 100) : discountType === "fixed" ? safeMinor(discountValue, currency) : 0;
    totals = calcTotals(lines, discountType, Number.isFinite(dv) ? dv : 0, Math.round(Number(taxRate || 0) * 100) || 0);
  } catch {
    /* invalid inputs are reported on submit */
  }
  return (
    <dl className="ml-auto grid w-full max-w-xs gap-1.5 text-[13.5px]">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular">{formatMoney(totals.subtotalCents, currency)}</dd></div>
      {totals.discountCents ? <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular">−{formatMoney(totals.discountCents, currency)}</dd></div> : null}
      {totals.taxCents ? <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="tabular">{formatMoney(totals.taxCents, currency)}</dd></div> : null}
      <div className="mt-1 flex justify-between border-t pt-2 text-[15px] font-semibold"><dt>Total</dt><dd className="tabular">{formatMoney(totals.totalCents, currency)}</dd></div>
      <p className="text-[11.5px] text-muted-foreground">Final totals are calculated and stored by the server.</p>
    </dl>
  );
}

export function DocumentEditor({
  kind,
  id,
  currency,
  initial,
  clients,
  leads = [],
  projects = [],
  services,
}: {
  kind: "proposal" | "invoice";
  id?: string;
  currency: string;
  initial: EditorValues;
  clients: Opt[];
  leads?: Opt[];
  projects?: (Opt & { client_id: string })[];
  services: ServiceOpt[];
}) {
  const router = useRouter();
  const { execute } = useServerAction();
  const form = useForm<EditorValues>({ defaultValues: initial });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "items" });
  const r = form.register;
  const e = form.formState.errors as Record<string, { message?: string } | undefined>;
  const clientId = form.watch("client_id");
  const discountType = form.watch("discount_type");

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={form.handleSubmit((v) =>
        execute(() => (kind === "proposal" ? saveProposal(id ?? null, v) : saveInvoice(id ?? null, v)), {
          onSuccess: (d) => router.push(kind === "proposal" ? `/admin/proposals/${d.id}` : `/admin/finance/invoices/${d.id}`),
          onError: (res) => applyFieldErrors(form, res.fieldErrors),
        }),
      )}
    >
      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          {kind === "proposal" ? (
            <Field label="Title" error={e.title?.message} required className="sm:col-span-2">
              <Input {...r("title")} />
            </Field>
          ) : null}
          <Field label="Client" error={e.client_id?.message} required={kind === "invoice"}>
            <NativeSelect {...r("client_id")}>
              <option value="">{kind === "proposal" ? "— (or choose a lead)" : "Select a client…"}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {kind === "proposal" ? (
            <Field label="Lead" hint="For prospects who aren't clients yet.">
              <NativeSelect {...r("lead_id")}>
                <option value="">—</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : (
            <Field label="Project">
              <NativeSelect {...r("project_id")}>
                <option value="">—</option>
                {projects.filter((p) => !clientId || p.client_id === clientId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          {kind === "invoice" ? (
            <>
              <Field label="Issue date" error={e.issue_date?.message}>
                <Input type="date" {...r("issue_date")} />
              </Field>
              <Field label="Due date" error={e.due_date?.message}>
                <Input type="date" {...r("due_date")} />
              </Field>
            </>
          ) : (
            <Field label="Valid until">
              <Input type="date" {...r("valid_until")} />
            </Field>
          )}
        </CardContent>
      </Card>

      {kind === "proposal" ? (
        <Card>
          <CardHeader>
            <CardTitle>Proposal content</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Summary" hint="The problem, the goal and your recommended approach.">
              <Textarea rows={4} {...r("summary")} />
            </Field>
            <Field label="Scope of work">
              <Textarea rows={6} {...r("scope")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Timeline">
                <Textarea rows={2} {...r("timeline")} />
              </Field>
              <Field label="Payment terms">
                <Textarea rows={2} {...r("payment_terms")} />
              </Field>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          {e.items?.message ? <span className="text-[12px] text-destructive">{e.items.message}</span> : null}
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="hidden grid-cols-[20px_1fr_80px_130px_130px_32px] gap-2 px-1 text-[12px] font-medium text-muted-foreground sm:grid">
            <span />
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price ({currency})</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {fields.map((f, idx) => (
            <ItemRow key={f.id} idx={idx} control={form.control} register={r} currency={currency} services={services} onRemove={() => remove(idx)} onUp={() => idx > 0 && move(idx, idx - 1)} setValue={form.setValue} />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", description: "", details: "", quantity: "1", unit_price: "" })}>
              <Plus /> Add line
            </Button>
          </div>
          <div className="mt-2 grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto]">
            <div className="grid max-w-md grid-cols-3 gap-3">
              <Field label="Discount">
                <NativeSelect {...r("discount_type")}>
                  <option value="none">None</option>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </NativeSelect>
              </Field>
              <Field label={discountType === "percent" ? "Discount %" : `Amount (${currency})`} error={e.discount_value?.message}>
                <Input inputMode="decimal" disabled={discountType === "none"} {...r("discount_value")} />
              </Field>
              <Field label="Tax %" error={e.tax_rate?.message}>
                <Input inputMode="decimal" {...r("tax_rate")} />
              </Field>
            </div>
            <Totals control={form.control} currency={currency} />
          </div>
        </CardContent>
      </Card>

      {kind === "invoice" ? (
        <Card>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            <Field label="Payment terms">
              <Textarea rows={2} {...r("payment_terms")} />
            </Field>
            <Field label="Notes (shown on invoice)">
              <Textarea rows={2} {...r("notes")} />
            </Field>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton pending={form.formState.isSubmitting}>{id ? "Save changes" : kind === "proposal" ? "Create proposal" : "Create draft invoice"}</SubmitButton>
      </div>
    </form>
  );
}

function ItemRow({
  idx, control, register, currency, services, onRemove, onUp, setValue,
}: {
  idx: number;
  control: Control<EditorValues>;
  register: ReturnType<typeof useForm<EditorValues>>["register"];
  currency: string;
  services: ServiceOpt[];
  onRemove: () => void;
  onUp: () => void;
  setValue: ReturnType<typeof useForm<EditorValues>>["setValue"];
}) {
  const item = useWatch({ control, name: `items.${idx}` });
  let amount = 0;
  try {
    const q = String(item?.quantity ?? "").trim();
    if (/^\d+(\.\d{1,2})?$/.test(q)) amount = calcTotals([{ quantity: q, unitPriceCents: safeMinor(item?.unit_price ?? "", currency) }], "none", 0, 0).totalCents;
  } catch {
    amount = 0;
  }
  return (
    <div className="grid gap-2 rounded-md border p-2 sm:grid-cols-[20px_1fr_80px_130px_130px_32px] sm:items-start sm:border-0 sm:p-0">
      <button type="button" onClick={onUp} className="hidden h-9 items-center text-muted-foreground/60 hover:text-foreground sm:flex" aria-label="Move up">
        <GripVertical className="size-4" />
      </button>
      <div className="grid gap-1.5">
        <div className="flex gap-2">
          <NativeSelect
            aria-label="Service"
            className="w-40 shrink-0"
            {...register(`items.${idx}.service_id`, {
              onChange: (ev) => {
                const s = services.find((x) => x.id === ev.target.value);
                if (s) {
                  if (!item?.description) setValue(`items.${idx}.description`, s.name);
                  if (!item?.unit_price && s.starting_price_cents) setValue(`items.${idx}.unit_price`, minorToInput(s.starting_price_cents, currency));
                }
              },
            })}
          >
            <option value="">Custom item</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
          <Input aria-label="Description" placeholder="Description" {...register(`items.${idx}.description`)} />
        </div>
        <Input aria-label="Details" placeholder="Details (optional)" className="h-8 text-[12.5px]" {...register(`items.${idx}.details`)} />
      </div>
      <Input aria-label="Quantity" inputMode="decimal" className="text-right" {...register(`items.${idx}.quantity`)} />
      <Input aria-label="Unit price" inputMode="decimal" className="text-right" placeholder="0.00" {...register(`items.${idx}.unit_price`)} />
      <div className="flex h-9 items-center justify-end text-[13.5px] font-medium tabular">{formatMoney(amount, currency)}</div>
      <Button type="button" variant="ghost" size="icon-sm" className="mt-0.5" onClick={onRemove} aria-label="Remove line">
        <Trash />
      </Button>
    </div>
  );
}
