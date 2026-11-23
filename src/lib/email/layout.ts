import { siteConfig } from "@/config/site";

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface EmailParts {
  subject: string;
  preheader?: string;
  heading: string;
  paragraphs: string[]; // already-escaped HTML fragments
  cta?: { label: string; url: string };
  details?: { label: string; value: string }[];
  footnote?: string;
}

/** Minimal, table-based layout that renders consistently across email clients. */
export function renderEmail(parts: EmailParts): { subject: string; html: string; text: string } {
  const brand = "#1f6f5c";
  const details = parts.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e7e7ea;border-radius:8px">
        ${parts.details
          .map(
            (d) => `<tr><td style="padding:10px 14px;font-size:13px;color:#6b6b76;border-bottom:1px solid #f0f0f2">${esc(d.label)}</td>
                     <td style="padding:10px 14px;font-size:13px;color:#18181b;text-align:right;border-bottom:1px solid #f0f0f2">${esc(d.value)}</td></tr>`,
          )
          .join("")}
      </table>`
    : "";
  const cta = parts.cta
    ? `<p style="margin:24px 0"><a href="${esc(parts.cta.url)}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px">${esc(parts.cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(parts.subject)}</title></head>
<body style="margin:0;background:#f6f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<span style="display:none;max-height:0;overflow:hidden">${esc(parts.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e7ea;border-radius:12px">
<tr><td style="padding:28px 32px 0"><span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:6px;background:${brand};color:#fff;font-family:Georgia,serif;font-size:17px">${esc(siteConfig.logo.mark)}</span>
<span style="font-weight:600;font-size:15px;vertical-align:middle;margin-left:8px">${esc(siteConfig.name)}</span></td></tr>
<tr><td style="padding:24px 32px 32px">
<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;font-weight:600">${esc(parts.heading)}</h1>
${parts.paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:14.5px;line-height:1.6;color:#3f3f46">${p}</p>`).join("")}
${details}${cta}
${parts.footnote ? `<p style="margin:20px 0 0;font-size:12.5px;line-height:1.5;color:#8a8a94">${parts.footnote}</p>` : ""}
</td></tr></table>
<p style="font-size:12px;color:#8a8a94;margin:16px 0 0">${esc(siteConfig.name)} · ${esc(siteConfig.contact.address)} · <a href="mailto:${esc(siteConfig.contact.email)}" style="color:#8a8a94">${esc(siteConfig.contact.email)}</a></p>
</td></tr></table></body></html>`;

  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const text = [
    parts.heading,
    "",
    ...parts.paragraphs.map(strip),
    ...(parts.details ?? []).map((d) => `${d.label}: ${d.value}`),
    parts.cta ? `\n${parts.cta.label}: ${parts.cta.url}` : "",
    parts.footnote ? `\n${strip(parts.footnote)}` : "",
    `\n— ${siteConfig.name}`,
  ].join("\n");
  return { subject: parts.subject, html, text };
}
