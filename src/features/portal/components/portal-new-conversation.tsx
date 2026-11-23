"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/shared/form";
import { useDialogClose } from "@/components/shared/form-dialog";
import { useServerAction } from "@/hooks/use-action";
import { portalStartConversation } from "@/features/messages/actions";

export function PortalNewConversation({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const close = useDialogClose();
  const { execute, pending } = useServerAction();
  const [subject, setSubject] = useState("");
  const [projectId, setProjectId] = useState("");
  return (
    <div className="grid gap-4">
      <Field label="About">
        <NativeSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">General question</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Subject">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button disabled={pending || subject.trim().length < 2} onClick={() => execute(() => portalStartConversation({ subject, projectId: projectId || null }), { onSuccess: (d) => { close?.(); router.push(`/portal/messages?c=${d.id}`); } })}>
          Start
        </Button>
      </div>
    </div>
  );
}
