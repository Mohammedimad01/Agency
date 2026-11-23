"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ActionError, dbError, parseInput, teamAction } from "@/lib/action";
import { getCurrency } from "@/features/settings/queries";
import { contractSchema, expenseSchema, invoiceSchema, normaliseDiscount, paymentSchema } from "./schemas";
import { toItemPayload } from "./items";
import { dispatchOutbox } from "@/lib/email/dispatcher";

// --- Invoices -------------------------------------------------------------------
export async function saveInvoice(id: string | null, input: unknown) {
  return teamAction("finance.manage", async (ctx) => {
    const currency = await getCurrency(ctx.organizationId);
    const d = parseInput(invoiceSchema(currency), input);
    let discount: number;
    try {
      discount = normaliseDiscount(d.discount_type, d.discount_value, currency);
    } catch (e) {
      throw new ActionError((e as Error).message, { discount_value: [(e as Error).message] });
    }
    const sb = await createClient();
    const header = {
      client_id: d.client_id, project_id: d.project_id ?? null, issue_date: d.issue_date, due_date: d.due_date, payment_terms: d.payment_terms ?? null,
      notes: d.notes ?? null, discount_type: d.discount_type, discount_value: discount, tax_rate_bps: d.tax_rate,
    };
    let invoiceId = id;
    if (id) {
      const { data, error } = await sb.from("invoices").update(header).eq("id", id).select("id").maybeSingle();
      if (error) dbError(error);
      if (!data) throw new ActionError("Invoice not found.");
    } else {
      const { data, error } = await sb.from("invoices").insert({ ...header, organization_id: ctx.organizationId, number: "", status: "draft", created_by: ctx.userId }).select("id").single();
      if (error) dbError(error);
      invoiceId = data.id;
    }
    const { error: itemsError } = await sb.rpc("replace_document_items", { p_kind: "invoice", p_id: invoiceId!, p_items: toItemPayload(d.items) });
    if (itemsError) dbError(itemsError);
    revalidatePath("/admin/finance/invoices");
    return { id: invoiceId! };
  }, "Invoice saved");
}

/** Issues the invoice: client notification + email are triggered by the database (workflow: invoice generated). */
export async function sendInvoice(id: string) {
  return teamAction("finance.manage", async () => {
    const sb = await createClient();
    const { data: inv } = await sb.from("invoices").select("status, total_cents").eq("id", id).maybeSingle();
    if (!inv) throw new ActionError("Invoice not found.");
    if (inv.status !== "draft") throw new ActionError("This invoice has already been issued.");
    if (inv.total_cents <= 0) throw new ActionError("The invoice total must be greater than zero.");
    const { error } = await sb.from("invoices").update({ status: "sent" }).eq("id", id);
    if (error) dbError(error);
    after(() => dispatchOutbox({ limit: 10 }).catch(() => undefined));
    revalidatePath(`/admin/finance/invoices/${id}`);
    return null;
  }, "Invoice issued and sent to the client");
}

export async function cancelInvoice(id: string) {
  return teamAction("finance.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("invoices").update({ status: "cancelled" }).eq("id", id);
    if (error) dbError(error);
    revalidatePath(`/admin/finance/invoices/${id}`);
    return null;
  }, "Invoice cancelled");
}

export async function deleteDraftInvoice(id: string) {
  return teamAction("finance.manage", async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("invoices").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("status", "draft").select("id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("Only draft invoices can be deleted. Cancel issued invoices instead.");
    revalidatePath("/admin/finance/invoices");
    return null;
  }, "Draft deleted");
}

// --- Payments (workflow #10: balances update in the database) ------------------------
export async function recordPayment(input: unknown) {
  return teamAction("finance.manage", async (ctx) => {
    const d = parseInput(paymentSchema(await getCurrency(ctx.organizationId)), input);
    const sb = await createClient();
    const { data: inv } = await sb.from("invoices").select("id, client_id, organization_id").eq("id", d.invoice_id).maybeSingle();
    if (!inv) throw new ActionError("Invoice not found.");
    // client_id/organization_id/project_id are re-derived from the invoice by a trigger; never trusted from input.
    const { error } = await sb.from("payments").insert({
      organization_id: inv.organization_id, client_id: inv.client_id, invoice_id: d.invoice_id, amount_cents: d.amount, payment_date: d.payment_date,
      method: d.method, reference: d.reference ?? null, notes: d.notes ?? null, status: "completed", provider: "manual",
      idempotency_key: `manual:${d.idempotency_key}`, recorded_by: ctx.userId,
    });
    if (error) {
      if (error.code === "23505") return null; // duplicate submission: already recorded
      dbError(error);
    }
    revalidatePath(`/admin/finance/invoices/${d.invoice_id}`);
    revalidatePath("/admin/finance/payments");
    return null;
  }, "Payment recorded");
}

export async function setPaymentStatus(id: string, status: "completed" | "refunded" | "failed") {
  return teamAction("finance.manage", async () => {
    const sb = await createClient();
    const { data, error } = await sb.from("payments").update({ status }).eq("id", id).select("invoice_id").maybeSingle();
    if (error) dbError(error);
    if (!data) throw new ActionError("Payment not found.");
    revalidatePath(`/admin/finance/invoices/${data.invoice_id}`);
    return null;
  }, "Payment updated");
}

// --- Expenses -------------------------------------------------------------------
export async function saveExpense(id: string | null, input: unknown) {
  return teamAction("finance.manage", async (ctx) => {
    const d = parseInput(expenseSchema(await getCurrency(ctx.organizationId)), input);
    const sb = await createClient();
    const row = {
      category: d.category, description: d.description, amount_cents: d.amount, expense_date: d.expense_date, vendor: d.vendor ?? null,
      project_id: d.project_id ?? null, receipt_file_id: d.receipt_file_id ?? null,
    };
    const { error } = id ? await sb.from("expenses").update(row).eq("id", id) : await sb.from("expenses").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId });
    if (error) dbError(error);
    revalidatePath("/admin/finance/expenses");
    return null;
  }, "Expense saved");
}

export async function deleteExpense(id: string) {
  return teamAction("finance.manage", async () => {
    const sb = await createClient();
    const { error } = await sb.from("expenses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) dbError(error);
    revalidatePath("/admin/finance/expenses");
    return null;
  }, "Expense deleted");
}

// --- Contracts ------------------------------------------------------------------
export async function saveContract(id: string | null, input: unknown) {
  return teamAction("contracts.manage", async (ctx) => {
    const d = parseInput(contractSchema(await getCurrency(ctx.organizationId)), input);
    const sb = await createClient();
    const row = {
      client_id: d.client_id, project_id: d.project_id ?? null, title: d.title, description: d.description ?? null, status: d.status, value_cents: d.value ?? null,
      start_date: d.start_date ?? null, end_date: d.end_date ?? null, signed_by_name: d.signed_by_name ?? null,
      signed_at: d.signed_at ? new Date(`${d.signed_at}T12:00:00Z`).toISOString() : d.status === "signed" ? new Date().toISOString() : null, notes: d.notes ?? null,
    };
    if (id) {
      const { error } = await sb.from("contracts").update(row).eq("id", id);
      if (error) dbError(error);
      revalidatePath(`/admin/contracts/${id}`);
      return { id };
    }
    const { data, error } = await sb.from("contracts").insert({ ...row, organization_id: ctx.organizationId, created_by: ctx.userId }).select("id").single();
    if (error) dbError(error);
    revalidatePath("/admin/contracts");
    return { id: data.id };
  }, "Contract saved");
}

export async function addContractVersion(contractId: string, fileId: string, notes?: string) {
  return teamAction("contracts.manage", async (ctx) => {
    const sb = await createClient();
    const { data: c } = await sb.from("contracts").select("id, client_id, current_version").eq("id", contractId).maybeSingle();
    if (!c) throw new ActionError("Contract not found.");
    const version = c.current_version + 1;
    const { error } = await sb.from("contract_versions").insert({ contract_id: c.id, version, file_id: fileId, notes: notes ?? null, created_by: ctx.userId });
    if (error) dbError(error);
    await sb.from("files").update({ client_id: c.client_id, visibility: "client", category: "contract" }).eq("id", fileId);
    await sb.from("contracts").update({ current_version: version }).eq("id", c.id);
    revalidatePath(`/admin/contracts/${contractId}`);
    return null;
  }, "Document version uploaded");
}
