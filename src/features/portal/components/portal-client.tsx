"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FileUploader } from "@/components/shared/file-uploader";
import { Conversation } from "@/features/messages/components/conversation";
import { portalCreateUploadTarget, portalRegisterFile } from "@/features/files/actions";

export function PortalProjectFiles({ projectId }: { projectId: string }) {
  const router = useRouter();
  return (
    <FileUploader
      label="Share files with the team"
      hint="Briefs, content, brand assets — up to 50 MB each"
      createTarget={(f) => portalCreateUploadTarget(projectId, f)}
      register={(t, file) => portalRegisterFile({ path: t.path, name: file.name, projectId })}
      onComplete={() => router.refresh()}
    />
  );
}

export function PortalProjectConversation({ projectId, conversationId }: { projectId: string; conversationId: string }) {
  return (
    <Card className="overflow-hidden">
      <Conversation
        conversationId={conversationId}
        emptyHint="Questions or feedback? Message the project team here."
        upload={{
          createTarget: (f) => portalCreateUploadTarget(projectId, f),
          register: (t, file) => portalRegisterFile({ path: t.path, name: file.name, projectId }),
        }}
      />
    </Card>
  );
}
