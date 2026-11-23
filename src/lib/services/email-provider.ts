import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";
import { siteConfig } from "@/config/site";

export interface OutgoingEmail {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  replyTo?: string;
}

/** Provider abstraction: swap Resend for Postmark/SES/SMTP by implementing this interface. */
export interface EmailProvider {
  readonly name: string;
  send(email: OutgoingEmail): Promise<{ id: string }>;
}

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private client = new Resend(serverEnv.resendApiKey);
  async send(email: OutgoingEmail) {
    const from = serverEnv.emailFrom || `${siteConfig.name} <onboarding@resend.dev>`;
    const { data, error } = await this.client.emails.send(
      {
        from,
        to: email.toName ? `${email.toName.replace(/[<>"]/g, "")} <${email.to}>` : email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo ?? siteConfig.contact.email,
      },
      email.idempotencyKey ? { idempotencyKey: email.idempotencyKey.slice(0, 256) } : undefined,
    );
    if (error || !data) throw new Error(error?.message ?? "Resend returned no data");
    return { id: data.id };
  }
}

/** Development provider: prints emails to the server log instead of sending them. */
class ConsoleProvider implements EmailProvider {
  readonly name = "console";
  async send(email: OutgoingEmail) {
    const links = [...email.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((l) => l && !l.startsWith("mailto:"));
    console.info(`\n[email:console] → ${email.to}\n  Subject: ${email.subject}\n  Links: ${links.join("\n         ") || "—"}\n`);
    return { id: `console_${Date.now()}` };
  }
}

let provider: EmailProvider | null = null;
export function getEmailProvider(): EmailProvider {
  if (!provider) provider = serverEnv.emailProvider === "resend" && serverEnv.resendApiKey ? new ResendProvider() : new ConsoleProvider();
  return provider;
}
