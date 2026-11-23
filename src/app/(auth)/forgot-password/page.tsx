import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a secure link.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <Link href="/login" className="mt-6 inline-block text-[13px] text-muted-foreground hover:text-foreground">
        ← Back to sign in
      </Link>
    </div>
  );
}
