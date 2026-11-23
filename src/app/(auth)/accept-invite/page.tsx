import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcceptInviteForm } from "@/components/auth/forms";
import { getUser } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Accept invitation", robots: { index: false } };

export default async function AcceptInvitePage() {
  const user = await getUser();
  if (!user) redirect("/login?error=link_expired");
  const name = (user.user_metadata?.full_name as string | undefined) ?? "";
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to {siteConfig.name}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Signed in as {user.email}. Set a password to finish creating your account.</p>
      <div className="mt-6">
        <AcceptInviteForm defaultName={name} />
      </div>
    </div>
  );
}
