import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/forms";
import { getUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  if (!(await getUser())) redirect("/login?error=link_expired");
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">You&apos;ll be signed in once it&apos;s updated.</p>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
