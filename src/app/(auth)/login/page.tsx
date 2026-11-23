import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { getUser, homePathFor } from "@/lib/auth/session";
import { isSetupComplete } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  no_access: "Your account doesn't have access to a workspace yet. If you were invited, use the link in your invitation email.",
  link_expired: "That link is invalid or has expired. Please request a new one.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const user = await getUser();
  if (user && !error) redirect(await homePathFor());
  const setupDone = await isSetupComplete();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Team members and clients sign in here.</p>
      {error && ERRORS[error] ? <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">{ERRORS[error]}</p> : null}
      <div className="mt-6">
        <LoginForm next={next} />
      </div>
      {!setupDone ? (
        <p className="mt-6 text-[13px] text-muted-foreground">
          First time here?{" "}
          <Link href="/setup" className="font-medium text-primary hover:underline">
            Set up your agency workspace
          </Link>
        </p>
      ) : null}
    </div>
  );
}
