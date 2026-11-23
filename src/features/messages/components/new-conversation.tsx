"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { startConversation } from "../actions";

export function NewConversationForm({ clients, projects }: { clients: { id: string; name: string }[]; projects: { id: string; name: string; client_id: string }[] }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute, pending } = useServerAction();
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [subject, setSubject] = useState("");
  const [internal, setInternal] = useState(false);
  return (
    <div className="grid gap-4">
      <Field label="Client">
        <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Project (optional)">
        <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">General</option>
          {projects.filter((p) => p.client_id === clientId).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Subject">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={internal} onCheckedChange={(v) => setInternal(v === true)} />
        Internal thread (team only — never visible to the client)
      </label>
      <div className="flex justify-end">
        <Button
          disabled={pending || !clientId || subject.trim().length < 2}
          onClick={() =>
            execute(() => startConversation({ clientId, projectId: projectId || null, subject, internal }), {
              onSuccess: (d) => {
                close?.();
                router.push(`/admin/messages?c=${d.id}`);
              },
            })
          }
        >
          Start conversation
        </Button>
      </div>
    </div>
  );
}
