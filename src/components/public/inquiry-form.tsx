"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, NativeSelect, SubmitButton, applyFieldErrors } from "@/components/shared/form";
import { submitInquiry } from "@/features/inquiries/actions";
import { inquirySchema, BUDGET_RANGES, type InquiryInput } from "@/features/inquiries/schemas";
import { TIMELINE_OPTIONS } from "@/features/leads/qualification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function InquiryForm({
  kind,
  services,
  defaultService,
  className,
  delivery = "server",
}: {
  kind: "message" | "brief" | "booking";
  services: { slug: string; name: string }[];
  defaultService?: string;
  className?: string;
  /** "email" opens the visitor's email app (used until the backend is connected). */
  delivery?: "server" | "email";
}) {
  const [done, setDone] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      kind,
      fullName: "",
      email: "",
      phone: "",
      company: "",
      website: "",
      country: "",
      serviceSlug: defaultService ?? "",
      budget: "",
      timeline: "",
      message: "",
      preferredDate: "",
      preferredTime: "",
      timezone: "",
      company_url: "",
      elapsedMs: 0,
    },
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const e = formState.errors;
  const consent = watch("consent");

  function composeEmail(v: InquiryInput) {
    const service = services.find((s) => s.slug === v.serviceSlug)?.name;
    const budget = BUDGET_RANGES.find((b) => b.value === v.budget)?.label;
    const subject = `${kind === "booking" ? "Discovery call request" : kind === "brief" ? "Project brief" : "Enquiry"} — ${v.fullName}${v.company ? ` (${v.company})` : ""}`;
    const lines = [
      `Name: ${v.fullName}`,
      `Email: ${v.email}`,
      v.phone ? `Phone: ${v.phone}` : "",
      v.company ? `Company: ${v.company}` : "",
      v.website ? `Website: ${v.website}` : "",
      v.country ? `Country: ${v.country}` : "",
      service ? `Service: ${service}` : "",
      budget ? `Budget: ${budget}` : "",
      v.timeline ? `Timeline: ${v.timeline}` : "",
      v.preferredDate ? `Preferred time: ${v.preferredDate} ${v.preferredTime ?? ""}` : "",
    ]
      .filter(Boolean)
      .concat(["", v.message]);
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setEmailed(true);
    setDone(true);
  }

  async function onSubmit(values: InquiryInput) {
    if (delivery === "email") return composeEmail(values);
    const result = await submitInquiry({
      ...values,
      elapsedMs: Date.now() - startedAt.current,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (result.ok) {
      setDone(true);
      form.reset();
    } else {
      applyFieldErrors(form, result.fieldErrors);
      toast.error(result.error);
    }
  }

  if (done) {
    return (
      <div className={cn("rounded-xl border bg-card p-8 text-center", className)} role="status">
        <CircleCheck className="mx-auto size-8 text-primary" />
        <p className="mt-4 text-lg font-medium">{emailed ? "Almost there." : kind === "booking" ? "Call requested." : "Message received."}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {emailed ? (
            <>
              Your email app should have opened with your message ready to send. If it didn&apos;t, email us at{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="font-medium text-primary hover:underline">
                {siteConfig.contact.email}
              </a>
              .
            </>
          ) : (
            "Thank you — we'll get back to you within one business day. A confirmation is on its way to your inbox."
          )}
        </p>
      </div>
    );
  }

  const detailed = kind !== "message";
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("grid gap-4", className)} noValidate>
      <input type="hidden" {...register("kind")} />
      {/* Honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Leave this field empty
          <input tabIndex={-1} autoComplete="off" {...register("company_url")} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={e.fullName?.message} required>
          <Input id="fullName" autoComplete="name" aria-invalid={!!e.fullName} {...register("fullName")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={e.email?.message} required>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!e.email} {...register("email")} />
        </Field>
        <Field label="Company" htmlFor="company" error={e.company?.message}>
          <Input id="company" autoComplete="organization" {...register("company")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={e.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>
      {detailed ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Service" htmlFor="serviceSlug">
            <NativeSelect id="serviceSlug" {...register("serviceSlug")}>
              <option value="">Not sure yet</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Budget" htmlFor="budget">
            <NativeSelect id="budget" {...register("budget")}>
              <option value="">Select…</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Timeline" htmlFor="timeline">
            <NativeSelect id="timeline" {...register("timeline")}>
              <option value="">Select…</option>
              {TIMELINE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      ) : null}
      {kind === "brief" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current website" htmlFor="website">
            <Input id="website" placeholder="example.com" {...register("website")} />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input id="country" autoComplete="country-name" {...register("country")} />
          </Field>
        </div>
      ) : null}
      {kind === "booking" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred date" htmlFor="preferredDate" hint="We'll confirm a time that works.">
            <Input id="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)} {...register("preferredDate")} />
          </Field>
          <Field label="Preferred time" htmlFor="preferredTime">
            <Input id="preferredTime" type="time" step={900} {...register("preferredTime")} />
          </Field>
        </div>
      ) : null}
      <Field
        label={kind === "brief" ? "Project requirements" : kind === "booking" ? "What would you like to discuss?" : "Message"}
        htmlFor="message"
        error={e.message?.message}
        required
        hint={kind === "brief" ? "Goals, audience, key features, integrations, deadlines — anything that helps us scope." : undefined}
      >
        <Textarea id="message" rows={kind === "brief" ? 7 : 5} aria-invalid={!!e.message} {...register("message")} />
      </Field>
      <div className="flex items-start gap-2.5">
        <Checkbox id="consent" checked={consent === true} onCheckedChange={(v) => setValue("consent", (v === true) as true, { shouldValidate: true })} aria-invalid={!!e.consent} />
        <label htmlFor="consent" className="text-[13px] leading-snug text-muted-foreground">
          I agree to be contacted about this inquiry. We never share your details.
          {e.consent ? <span className="mt-1 block text-destructive">{e.consent.message}</span> : null}
        </label>
      </div>
      <div>
        <SubmitButton pending={formState.isSubmitting} size="lg" className="rounded-full px-6">
          {kind === "booking" ? "Request a call" : kind === "brief" ? "Send project brief" : "Send message"}
        </SubmitButton>
      </div>
    </form>
  );
}
