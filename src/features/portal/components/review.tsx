"use client";
import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, useDialogClose } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/form";
import { useServerAction } from "@/hooks/use-action";
import { acceptContract, markProposalViewed, respondToProposal, reviewDeliverable, updateMyContact } from "../actions";
import { Input } from "@/components/ui/input";

export function DeliverableReview({ deliverableId, title }: { deliverableId: string; title: string }) {
  const { execute, pending } = useServerAction();
  return (
    <div className="flex flex-wrap gap-2">
      <FormDialog title={`Approve “${title}”?`} description="Approving tells the team this version is final." trigger={<Button size="sm"><Check /> Approve</Button>}>
        <Confirm label="Approve" pending={pending} onConfirm={(close) => execute(() => reviewDeliverable({ deliverableId, decision: "approved" }), { onSuccess: close })} withNote={false} />
      </FormDialog>
      <FormDialog title="Request changes" description="Describe what you'd like changed. The team is notified immediately." trigger={<Button size="sm" variant="outline"><RotateCcw /> Request changes</Button>}>
        <Confirm label="Send feedback" pending={pending} withNote required onConfirm={(close, note) => execute(() => reviewDeliverable({ deliverableId, decision: "changes_requested", feedback: note }), { onSuccess: close })} />
      </FormDialog>
    </div>
  );
}

function Confirm({ label, onConfirm, pending, withNote, required }: { label: string; onConfirm: (close: () => void, note: string) => void; pending: boolean; withNote: boolean; required?: boolean }) {
  const close = useDialogClose();
  const [note, setNote] = useState("");
  return (
    <div className="grid gap-4">
      {withNote ? (
        <Field label={required ? "Your feedback" : "Note (optional)"}>
          <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </Field>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={pending || (required && !note.trim())} onClick={() => onConfirm(() => close?.(), note)}>
          {label}
        </Button>
      </div>
    </div>
  );
}

export function ProposalResponse({ proposalId }: { proposalId: string }) {
  const { execute, pending } = useServerAction();
  return (
    <div className="flex flex-wrap gap-2">
      <FormDialog title="Accept this proposal?" description="We'll record your acceptance and prepare the project and agreement." trigger={<Button><Check /> Accept proposal</Button>}>
        <Confirm label="Accept" pending={pending} withNote onConfirm={(close, note) => execute(() => respondToProposal({ proposalId, decision: "accepted", note }), { onSuccess: close })} />
      </FormDialog>
      <FormDialog title="Decline this proposal" description="Let us know why — we're happy to adjust scope or pricing." trigger={<Button variant="outline">Decline</Button>}>
        <Confirm label="Decline" pending={pending} withNote onConfirm={(close, note) => execute(() => respondToProposal({ proposalId, decision: "rejected", note }), { onSuccess: close })} />
      </FormDialog>
    </div>
  );
}

export function MarkViewed({ proposalId }: { proposalId: string }) {
  useEffect(() => {
    void markProposalViewed(proposalId);
  }, [proposalId]);
  return null;
}

export function AcceptContractButton({ contractId }: { contractId: string }) {
  const { execute, pending } = useServerAction();
  return (
    <Button size="sm" disabled={pending} onClick={() => execute(() => acceptContract(contractId))}>
      Record my acceptance
    </Button>
  );
}

export function ContactDetailsForm({ values }: { values: { full_name: string; phone: string; job_title: string } }) {
  const [v, setV] = useState(values);
  const { execute, pending } = useServerAction();
  return (
    <form
      className="grid gap-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        void execute(() => updateMyContact(v));
      }}
    >
      <Field label="Full name">
        <Input value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} />
      </Field>
      <Field label="Phone">
        <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </Field>
      <Field label="Job title">
        <Input value={v.job_title} onChange={(e) => setV({ ...v, job_title: e.target.value })} />
      </Field>
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          Save details
        </Button>
      </div>
    </form>
  );
}
