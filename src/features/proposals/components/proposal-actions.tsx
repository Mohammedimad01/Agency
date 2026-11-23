"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Check, FolderPlus, Pencil, Receipt, Send, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect } from "@/components/shared/form";
import { FormDialog, useDialogClose } from "@/components/shared/form-dialog";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { useServerAction } from "@/hooks/use-action";
import { archiveProposal, convertProposalToProject, invoiceFromProposal, recordProposalDecision, sendProposal } from "../actions";

type Opt = { id: string; name: string };

export function ProposalActions({ id, status, hasProject, projectId, canFinance, templates, team, leadOnly }: { id: string; status: string; hasProject: boolean; projectId: string | null; canFinance: boolean; templates: Opt[]; team: Opt[]; leadOnly: boolean }) {
  const router = useRouter();
  const editable = ["draft", "sent", "viewed"].includes(status);
  return (
    <>
      {editable ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/proposals/${id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
      ) : null}
      {status === "draft" ? (
        <ConfirmAction
          trigger={<Button size="sm"><Send /> Send to client</Button>}
          title="Send this proposal?"
          description={leadOnly ? "This prospect isn't a client yet: we'll create their client record and invite them to the portal, where they can review and accept the proposal." : "The client's contacts are notified by email and can review and accept it in their portal."}
          confirmLabel="Send"
          action={() => sendProposal(id)}
        />
      ) : null}
      {status === "sent" || status === "viewed" ? (
        <>
          <ConfirmAction trigger={<Button size="sm" variant="outline"><Check /> Mark accepted</Button>} title="Record acceptance?" description="Use this when the client accepted outside the portal (email, call, signed copy)." confirmLabel="Mark accepted" action={() => recordProposalDecision(id, "accepted")} />
          <ConfirmAction trigger={<Button size="sm" variant="ghost"><X /> Mark rejected</Button>} title="Record rejection?" confirmLabel="Mark rejected" destructive action={() => recordProposalDecision(id, "rejected")} />
        </>
      ) : null}
      {status === "accepted" && !hasProject ? (
        <FormDialog title="Create project from proposal" description="Creates the project (and a draft agreement with the recorded acceptance) using this proposal's scope and value." trigger={<Button size="sm"><FolderPlus /> Create project</Button>}>
          <ConvertBody id={id} templates={templates} team={team} />
        </FormDialog>
      ) : null}
      {hasProject && projectId ? (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/projects/${projectId}`}>Open project</Link>
        </Button>
      ) : null}
      {canFinance && status === "accepted" ? (
        <FormDialog title="Create invoice" description="Creates a draft invoice from this proposal. Use a percentage for deposits or milestone billing." trigger={<Button size="sm" variant="outline"><Receipt /> Invoice</Button>}>
          <InvoiceBody id={id} />
        </FormDialog>
      ) : null}
      <ConfirmAction trigger={<Button size="icon-sm" variant="ghost" aria-label="Archive"><Archive /></Button>} title="Archive this proposal?" destructive confirmLabel="Archive" action={() => archiveProposal(id)} onDone={() => router.push("/admin/proposals")} />
    </>
  );
}

function ConvertBody({ id, templates, team }: { id: string; templates: Opt[]; team: Opt[] }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute, pending } = useServerAction();
  const [template, setTemplate] = useState("");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [pm, setPm] = useState("");
  const [contract, setContract] = useState(true);
  return (
    <div className="grid gap-4">
      <Field label="Template">
        <NativeSelect value={template} onChange={(e) => setTemplate(e.target.value)}>
          <option value="">No template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Project manager">
          <NativeSelect value={pm} onChange={(e) => setPm(e.target.value)}>
            <option value="">Me</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={contract} onCheckedChange={(v) => setContract(v === true)} /> Create a draft agreement (contract) too
      </label>
      <div className="flex justify-end">
        <Button
          disabled={pending}
          onClick={() =>
            execute(() => convertProposalToProject(id, { template_id: template, start_date: start, project_manager_id: pm, create_contract: contract }), {
              onSuccess: (d) => {
                close?.();
                router.push(`/admin/projects/${d.project_id}`);
              },
            })
          }
        >
          Create project
        </Button>
      </div>
    </div>
  );
}

function InvoiceBody({ id }: { id: string }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute, pending } = useServerAction();
  const [pct, setPct] = useState("100");
  return (
    <div className="grid gap-4">
      <Field label="Percentage of proposal total" hint="e.g. 50 for a deposit invoice">
        <Input type="number" min={1} max={100} value={pct} onChange={(e) => setPct(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button disabled={pending} onClick={() => execute(() => invoiceFromProposal(id, Number(pct)), { onSuccess: (d) => { close?.(); router.push(`/admin/finance/invoices/${d.id}`); } })}>
          Create draft invoice
        </Button>
      </div>
    </div>
  );
}
