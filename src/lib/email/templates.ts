import { siteConfig } from "@/config/site";
import { formatDate, formatMoney } from "@/lib/format";
import { esc, renderEmail } from "./layout";

type Payload = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const greet = (p: Payload) => `Hi ${esc(s(p.recipient_name).split(" ")[0] || "there")},`;

export const EMAIL_TEMPLATES = {
  welcome: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Welcome to ${siteConfig.name}`,
      heading: `Welcome aboard`,
      paragraphs: [greet(p), `Your account is ready. You can sign in at any time to follow your work with us.`],
      cta: { label: "Sign in", url: url("/login") },
    }),
  client_invitation: (p: Payload) =>
    renderEmail({
      subject: `Your ${siteConfig.name} client portal is ready`,
      preheader: "Track projects, approve deliverables and view invoices in one place.",
      heading: "You've been invited to the client portal",
      paragraphs: [
        greet(p),
        `${esc(s(p.inviter) || siteConfig.name)} has given you access to your private client workspace for <strong>${esc(s(p.client_name))}</strong>.`,
        "From the portal you can track project progress, review and approve deliverables, message the team and download invoices.",
      ],
      cta: { label: "Set up your account", url: s(p.action_link) },
      footnote: "This link expires in 24 hours and can only be used once. If you weren't expecting this email, you can ignore it.",
    }),
  team_invitation: (p: Payload) =>
    renderEmail({
      subject: `Join ${siteConfig.name} on the team workspace`,
      heading: "You've been invited to join the team",
      paragraphs: [greet(p), `${esc(s(p.inviter))} invited you to join <strong>${esc(siteConfig.name)}</strong> as <strong>${esc(s(p.role))}</strong>.`],
      cta: { label: "Accept invitation", url: s(p.action_link) },
      footnote: "This link expires in 24 hours and can only be used once.",
    }),
  password_reset: (p: Payload) =>
    renderEmail({
      subject: "Reset your password",
      heading: "Reset your password",
      paragraphs: [greet(p), "We received a request to reset your password. Use the button below to choose a new one."],
      cta: { label: "Choose a new password", url: s(p.action_link) },
      footnote: "If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  verify_email: (p: Payload) =>
    renderEmail({
      subject: `Confirm your email for ${siteConfig.name}`,
      heading: "Confirm your email address",
      paragraphs: [greet(p), "Please confirm your email address to finish setting up your account."],
      cta: { label: "Confirm email", url: s(p.action_link) },
    }),
  inquiry_received: (p: Payload) =>
    renderEmail({
      subject: `Thanks for contacting ${siteConfig.name}`,
      heading: p.kind === "booking" ? "We've received your call request" : "We've received your message",
      paragraphs: [
        greet(p),
        p.kind === "booking"
          ? "Thanks for requesting a discovery call. We'll confirm a time with you within one business day."
          : "Thanks for reaching out. A member of our team will review your project and reply within one business day.",
      ],
      footnote: `Need to add something? Just reply to this email or write to ${esc(siteConfig.contact.email)}.`,
    }),
  new_lead: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `New lead: ${s(p.lead_name)}${p.company ? ` (${s(p.company)})` : ""}`,
      heading: "A new lead just came in",
      paragraphs: [esc(s(p.description)) || "No description provided."],
      details: [
        { label: "Name", value: s(p.lead_name) },
        { label: "Email", value: s(p.email) },
        ...(p.company ? [{ label: "Company", value: s(p.company) }] : []),
        ...(p.service ? [{ label: "Service", value: s(p.service) }] : []),
        ...(p.budget ? [{ label: "Budget", value: s(p.budget) }] : []),
      ],
      cta: { label: "Open in CRM", url: url(s(p.link)) },
    }),
  new_project: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Your project "${s(p.project_name)}" has started`,
      heading: "Your project workspace is ready",
      paragraphs: [greet(p), `We've set up <strong>${esc(s(p.project_name))}</strong> in your client portal, where you can follow milestones, review deliverables and message the team.`],
      details: [
        { label: "Project", value: `${s(p.project_name)} (${s(p.project_code)})` },
        ...(p.start_date ? [{ label: "Start", value: formatDate(s(p.start_date)) }] : []),
        ...(p.due_date ? [{ label: "Target delivery", value: formatDate(s(p.due_date)) }] : []),
      ],
      cta: { label: "Open project", url: url(s(p.link)) },
    }),
  milestone_update: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Milestone completed: ${s(p.milestone)}`,
      heading: `${s(p.milestone)} is complete`,
      paragraphs: [greet(p), `We've completed the <strong>${esc(s(p.milestone))}</strong> milestone on ${esc(s(p.project_name))}.`],
      details: [{ label: "Overall progress", value: `${s(p.progress)}%` }],
      cta: { label: "View progress", url: url(s(p.link)) },
    }),
  proposal_sent: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Proposal ${s(p.number)}: ${s(p.proposal_title)}`,
      heading: "Your proposal is ready",
      paragraphs: [greet(p), `We've prepared a proposal for <strong>${esc(s(p.proposal_title))}</strong>. You can review the scope, timeline and pricing — and accept it — from your portal.`],
      details: [
        { label: "Total", value: formatMoney(Number(p.total_cents ?? 0), s(p.currency) || "USD") },
        ...(p.valid_until ? [{ label: "Valid until", value: formatDate(s(p.valid_until)) }] : []),
      ],
      cta: { label: "Review proposal", url: url(s(p.link)) },
    }),
  invoice_generated: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Invoice ${s(p.number)} from ${siteConfig.name}`,
      heading: `Invoice ${s(p.number)}`,
      paragraphs: [greet(p), "A new invoice is available in your client portal. Payment instructions are included on the invoice."],
      details: [
        { label: "Amount due", value: formatMoney(Number(p.total_cents ?? 0), s(p.currency) || "USD") },
        { label: "Due date", value: formatDate(s(p.due_date)) },
      ],
      cta: { label: "View invoice", url: url(s(p.link)) },
    }),
  payment_reminder: (p: Payload, url: (path: string) => string) => {
    const late = Number(p.days_late ?? 0);
    return renderEmail({
      subject: late > 0 ? `Reminder: invoice ${s(p.number)} is overdue` : `Upcoming: invoice ${s(p.number)} is due soon`,
      heading: late > 0 ? "A friendly reminder about your invoice" : "Your invoice is due soon",
      paragraphs: [
        greet(p),
        late > 0
          ? `Invoice ${esc(s(p.number))} was due on ${esc(formatDate(s(p.due_date)))}. If you've already paid, thank you — please ignore this message.`
          : `Invoice ${esc(s(p.number))} is due on ${esc(formatDate(s(p.due_date)))}.`,
      ],
      details: [{ label: "Balance", value: formatMoney(Number(p.balance_cents ?? 0), s(p.currency) || "USD") }],
      cta: { label: "View invoice", url: url(s(p.link)) },
    });
  },
  deliverable_ready: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `Ready for review: ${s(p.deliverable)}`,
      heading: "A deliverable is ready for your review",
      paragraphs: [greet(p), `<strong>${esc(s(p.deliverable))}</strong> (version ${esc(s(p.version))}) for ${esc(s(p.project_name))} is ready. You can approve it or request changes from your portal.`],
      cta: { label: "Review deliverable", url: url(s(p.link)) },
    }),
  project_completed: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `${s(p.project_name)} is complete`,
      heading: "Your project is complete 🎉",
      paragraphs: [greet(p), `We've wrapped up <strong>${esc(s(p.project_name))}</strong>. All final files remain available in your portal.`, "Thank you for trusting us with your work."],
      cta: { label: "Open project", url: url(s(p.link)) },
    }),
  review_request: (p: Payload, url: (path: string) => string) =>
    renderEmail({
      subject: `How did we do on ${s(p.project_name)}?`,
      heading: "Would you share a few words about working with us?",
      paragraphs: [greet(p), `It was a pleasure delivering ${esc(s(p.project_name))}. A short testimonial helps other teams find us — and helps us improve.`],
      cta: { label: "Share feedback", url: url(s(p.link)) },
      footnote: "Reply to this email if you'd prefer — two or three sentences is perfect.",
    }),
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;
export const isEmailTemplate = (t: string): t is EmailTemplateName => t in EMAIL_TEMPLATES;

/** Templates that must always be delivered regardless of notification preferences. */
export const TRANSACTIONAL_ONLY: EmailTemplateName[] = ["client_invitation", "team_invitation", "password_reset", "verify_email", "inquiry_received", "welcome"];
