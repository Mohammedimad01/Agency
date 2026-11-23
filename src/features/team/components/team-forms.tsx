"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Ellipsis, Pencil, UserCheck, UserX, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { FormDialog, useDialogClose } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { inviteTeamMember, revokeInvitation, setMemberStatus, setRolePermission, updateTeamMember } from "../actions";
import { ROLE_LABELS, TEAM_ROLES, type TeamRole } from "@/lib/permissions";

export function InviteForm({ canInviteOwner }: { canInviteOwner: boolean }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm({ defaultValues: { full_name: "", email: "", role_key: "developer" as TeamRole, title: "" } });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => inviteTeamMember(v), { onSuccess: () => close?.(), onError: (r) => applyFieldErrors(form, r.fieldErrors) }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={form.formState.errors.full_name?.message} required>
          <Input {...form.register("full_name")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message} required>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Role">
          <NativeSelect {...form.register("role_key")}>
            {TEAM_ROLES.filter((r) => r !== "owner" || canInviteOwner).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Job title">
          <Input {...form.register("title")} />
        </Field>
      </div>
      <p className="text-[12.5px] text-muted-foreground">They&apos;ll receive an email to set a password. Access starts once they accept.</p>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Send invitation</SubmitButton>
      </div>
    </form>
  );
}

function MemberForm({ memberId, values, currency, canEditCost, canAssignOwner }: { memberId: string; values: { role_key: TeamRole; title: string; capacity_hours_per_week: number; hourly_cost: string }; currency: string; canEditCost: boolean; canAssignOwner: boolean }) {
  const close = useDialogClose();
  const { execute } = useServerAction();
  const form = useForm({ defaultValues: values });
  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((v) => execute(() => updateTeamMember(memberId, v), { onSuccess: () => close?.() }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role">
          <NativeSelect {...form.register("role_key")}>
            {TEAM_ROLES.filter((r) => r !== "owner" || canAssignOwner).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Job title">
          <Input {...form.register("title")} />
        </Field>
        <Field label="Capacity (hours / week)">
          <Input type="number" min={0} max={168} {...form.register("capacity_hours_per_week")} />
        </Field>
        {canEditCost ? (
          <Field label={`Internal hourly cost (${currency})`} hint="Used for project profitability.">
            <Input inputMode="decimal" {...form.register("hourly_cost")} />
          </Field>
        ) : null}
      </div>
      <div className="flex justify-end">
        <SubmitButton pending={form.formState.isSubmitting}>Save</SubmitButton>
      </div>
    </form>
  );
}

export function MemberActions(props: {
  memberId: string;
  status: "invited" | "active" | "deactivated";
  isSelf: boolean;
  values: { role_key: TeamRole; title: string; capacity_hours_per_week: number; hourly_cost: string };
  currency: string;
  canEditCost: boolean;
  canAssignOwner: boolean;
  protectedOwner: boolean;
}) {
  const { execute, pending } = useServerAction();
  const [edit, setEdit] = useState(false);
  if (props.protectedOwner) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Member actions" disabled={pending}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEdit(true)}>
            <Pencil /> Edit role & capacity
          </DropdownMenuItem>
          {props.status === "invited" ? (
            <DropdownMenuItem destructive onSelect={() => execute(() => revokeInvitation(props.memberId))}>
              <X /> Revoke invitation
            </DropdownMenuItem>
          ) : props.status === "active" && !props.isSelf ? (
            <DropdownMenuItem destructive onSelect={() => execute(() => setMemberStatus(props.memberId, "deactivated"))}>
              <UserX /> Deactivate
            </DropdownMenuItem>
          ) : props.status === "deactivated" ? (
            <DropdownMenuItem onSelect={() => execute(() => setMemberStatus(props.memberId, "active"))}>
              <UserCheck /> Reactivate
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <FormDialog title="Edit team member" open={edit} onOpenChange={setEdit}>
        <MemberForm memberId={props.memberId} values={props.values} currency={props.currency} canEditCost={props.canEditCost} canAssignOwner={props.canAssignOwner} />
      </FormDialog>
    </>
  );
}

export function PermissionToggle({ role, permission, checked, disabled }: { role: string; permission: string; checked: boolean; disabled: boolean }) {
  const { execute, pending } = useServerAction();
  return (
    <Checkbox
      checked={checked}
      disabled={disabled || pending}
      aria-label={`${permission} for ${role}`}
      onCheckedChange={(v) => execute(() => setRolePermission(role, permission, v === true), { success: "Permissions updated" })}
    />
  );
}
