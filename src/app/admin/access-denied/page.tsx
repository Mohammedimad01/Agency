import Link from "next/link";
import { ShieldBan } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AccessDenied() {
  return (
    <EmptyState
      icon={ShieldBan}
      title="You don't have access to this area"
      description="Your role doesn't include this permission. Ask an owner or administrator if you need access."
      action={
        <Button variant="outline" asChild>
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      }
      className="mt-16"
    />
  );
}
