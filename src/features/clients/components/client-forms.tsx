"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MoreHorizontalIcon, Pencil, ShieldOff, Trash } from "./icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormDialog } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { useDialogClose } from "@/components/shared/form-dialog";
import { inviteContactToPortal, removeContact, revokePortalAccess, saveClient, saveContact } from "../actions";
import { clientSchema, contactSchema, type ClientInput, type ContactInput } from "../schemas";
import { useState } from "react";

export function ClientForm({ client, team, onDone }: { client?: { id: string } & Partial<ClientInput>; team: { id: string; name: string }[]; onDone?: () => void }) {
  const router = useRouter();
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: "company", name: "", company_name: "", email: "", phone: "", website: "", industry: "", address_line1: "", address_line2: "",
      city: "", state: "", postal_code: "", country: "", tax_id: "", status: "active", source: "", account_manager_id: "", notes: "", ...client,
    },
  });
  const e = form.formState.errors;
  const r = form.register;
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={form.handleSubmit((v) =>
        execute(() => saveClient(client?.id ?? null, v), {
          onSuccess: (d) => {
            (onDone ?? dialogClose)?.();
            if (!client?.id) router.push(`/admin/clients/${d.id}`);
          },
          onError: (res) => applyFieldErrors(form, res.fieldErrors),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <NativeSelect {...r("type")}>
            <option value="company">Company</option>
            <option value="individual">Individual</option>
          </NativeSelect>
        </Field>
        <Field label="Display name" error={e.name?.message} required>
          <Input {...r("name")} aria-invalid={!!e.name} />
        </Field>
        <Field label="Legal / company name">
          <Input {...r("company_name")} />
        </Field>
        <Field label="Billing email" error={e.email?.message} hint="Creates the primary contact for new clients.">
          <Input type="email" {...r("email")} />
        </Field>
        <Field label="Phone">
          <Input {...r("phone")} />
        </Field>
        <Field label="Website" error={e.website?.message}>
          <Input {...r("website")} />
        </Field>
        <Field label="Industry">
          <Input {...r("industry")} />
        </Field>
        <Field label="Acquisition source">
          <Input {...r("source")} placeholder="referral, website…" />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input {...r("address_line1")} placeholder="Street address" />
        </Field>
        <Field label="City">
          <Input {...r("city")} />
        </Field>
        <Field label="State / region">
          <Input {...r("state")} />
        </Field>
        <Field label="Postal code">
          <Input {...r("postal_code")} />
        </Field>
        <Field label="Country">
          <Input {...r("country")} />
        </Field>
        <Field label="Tax ID">
          <Input {...r("tax_id")} />
        </Field>
        <Field label="Account manager">
          <NativeSelect {...r("account_manager_id")}>
            <option value="">—</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status">
          <NativeSelect {...r("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Internal notes">
        <Textarea rows={3} {...r("notes")} />
      </Field>
      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pending={form.formState.isSubmitting}>{client?.id ? "Save changes" : "Create client"}</SubmitButton>
      </div>
    </form>
  );
}

export function ContactForm({ contact, clientId, onDone }: { contact?: ContactInput; clientId: string; onDone?: () => void }) {
  const { execute } = useServerAction();
  const dialogClose = useDialogClose();
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { client_id: clientId, full_name: "", email: "", phone: "", job_title: "", is_primary: false, id: "", ...contact },
  });
  const e = form.formState.errors;
  return (
    <form noValidate className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => saveContact(v), { onSuccess: () => (onDone ?? dialogClose)?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={e.full_name?.message} required>
          <Input {...form.register("full_name")} />
        </Field>
        <Field label="Email" error={e.email?.message} required>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Phone">
          <Input {...form.register("phone")} />
        </Field>
        <Field label="Job title">
          <Input {...form.register("job_title")} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.watch("is_primary") === true} onCheckedChange={(v) => form.setValue("is_primary", v === true)} />
        Primary contact (receives invoices and project updates)
      </label>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save contact</SubmitButton>
      </div>
    </form>
  );
}

export function ContactActions({ contact, canManage }: { contact: ContactInput & { id: string; portal_access: boolean; profile_id: string | null }; canManage: boolean }) {
  const { execute, pending } = useServerAction();
  const [editing, setEditing] = useState(false);
  if (!canManage) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Contact actions" disabled={pending}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => execute(() => inviteContactToPortal(contact.id))}>
            <KeyRound /> {contact.profile_id ? "Resend portal invitation" : "Invite to portal"}
          </DropdownMenuItem>
          {contact.portal_access ? (
            <DropdownMenuItem onSelect={() => execute(() => revokePortalAccess(contact.id))}>
              <ShieldOff /> Revoke portal access
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => execute(() => removeContact(contact.id))}>
            <Trash /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FormDialog title="Edit contact" open={editing} onOpenChange={setEditing}>
        {(close) => <ContactForm contact={contact} clientId={String(contact.client_id)} onDone={close} />}
      </FormDialog>
    </>
  );
}
