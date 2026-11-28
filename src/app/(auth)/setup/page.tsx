import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetupForm } from "@/components/auth/forms";
import { isSetupComplete } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Set up your workspace", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || (await isSetupComplete())) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Set up your workspace</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Create the agency and your owner account. This page disappears once setup is complete.</p>
      <div className="mt-6">
        <SetupForm />
      </div>
    </div>
  );
}
