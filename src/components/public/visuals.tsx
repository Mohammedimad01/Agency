import { Check, Search, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Product vignettes drawn in code (no stock photos). They illustrate the kinds
 * of things Erlyst builds and are labelled as examples wherever shown.
 */

export function BrowserMockup({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={cn("overflow-hidden rounded-xl border shadow-2xl", dark ? "border-white/10 bg-[oklch(0.24_0.02_170)]" : "bg-white", className)}>
      <div className={cn("flex items-center gap-1.5 border-b px-3 py-2", dark ? "border-white/10" : "border-black/5 bg-[oklch(0.97_0.003_120)]")}>
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className={cn("ml-3 h-4 flex-1 rounded-md px-2 text-[8.5px] leading-4", dark ? "bg-white/5 text-white/40" : "bg-black/[0.04] text-black/40")}>yourbusiness.com</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className={cn("h-2 w-12 rounded-full", dark ? "bg-white/70" : "bg-black/70")} />
          <span className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-1.5 w-6 rounded-full", dark ? "bg-white/20" : "bg-black/15")} />
            ))}
            <span className="h-1.5 w-8 rounded-full bg-[var(--signal)]" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-[1.2fr_1fr] gap-4">
          <div className="space-y-2">
            <span className={cn("block h-3 w-[92%] rounded", dark ? "bg-white/85" : "bg-black/80")} />
            <span className={cn("block h-3 w-[70%] rounded", dark ? "bg-white/85" : "bg-black/80")} />
            <span className={cn("block h-1.5 w-[85%] rounded-full", dark ? "bg-white/25" : "bg-black/15")} />
            <span className={cn("block h-1.5 w-[60%] rounded-full", dark ? "bg-white/25" : "bg-black/15")} />
            <span className="mt-3 flex gap-2">
              <span className="h-4 w-14 rounded-full bg-primary" />
              <span className={cn("h-4 w-12 rounded-full border", dark ? "border-white/20" : "border-black/15")} />
            </span>
          </div>
          <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,var(--brand),color-mix(in_oklch,var(--brand)_40%,var(--signal)))]" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("rounded-md p-2", dark ? "bg-white/5" : "bg-black/[0.03]")}>
              <span className={cn("block size-3 rounded", i === 1 ? "bg-[var(--signal)]" : "bg-primary/70")} />
              <span className={cn("mt-2 block h-1.5 w-[80%] rounded-full", dark ? "bg-white/30" : "bg-black/20")} />
              <span className={cn("mt-1 block h-1.5 w-[55%] rounded-full", dark ? "bg-white/15" : "bg-black/10")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoiceCard({ className }: { className?: string }) {
  return (
    <div className={cn("w-56 rounded-xl border bg-white p-3.5 text-[11px] text-[oklch(0.25_0.01_170)] shadow-xl", className)}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Invoice INV-0142</span>
        <span className="rounded-full bg-[oklch(0.95_0.05_155)] px-1.5 py-0.5 text-[9.5px] font-medium text-[oklch(0.42_0.11_155)]">Paid</span>
      </div>
      <div className="mt-3 space-y-1.5 text-black/55">
        <div className="flex justify-between"><span>Design & build</span><span>4,500.00</span></div>
        <div className="flex justify-between"><span>SEO setup</span><span>750.00</span></div>
        <div className="flex justify-between"><span>VAT 5%</span><span>262.50</span></div>
      </div>
      <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
        <span>Total</span>
        <span>5,512.50</span>
      </div>
    </div>
  );
}

export function RankingCard({ className }: { className?: string }) {
  return (
    <div className={cn("w-60 rounded-xl border bg-white p-3.5 text-[11px] shadow-xl", className)}>
      <div className="flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-black/50">
        <Search className="size-3" /> web design company near me
      </div>
      <div className="mt-3 flex items-start gap-2">
        <span className="mt-0.5 rounded bg-[var(--signal)] px-1 text-[9.5px] font-bold text-[var(--ink)]">#1</span>
        <div>
          <p className="text-[10px] text-black/45">yourbusiness.com</p>
          <p className="font-semibold text-[oklch(0.42_0.14_255)]">Your business — Web design & development</p>
          <p className="text-black/50">Fast, SEO-ready websites for growing companies…</p>
        </div>
      </div>
    </div>
  );
}

export function TrafficCard({ className }: { className?: string }) {
  const pts = [8, 10, 9, 13, 12, 16, 15, 20, 23, 22, 28, 31];
  const max = 32;
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 100},${40 - (v / max) * 40}`).join(" ");
  return (
    <div className={cn("w-52 rounded-xl border bg-white p-3.5 shadow-xl", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-black/80">Organic clicks</span>
        <span className="flex items-center gap-0.5 font-semibold text-[oklch(0.45_0.12_155)]">
          <TrendingUp className="size-3" /> growing
        </span>
      </div>
      <svg viewBox="0 0 100 40" className="mt-2 h-12 w-full" preserveAspectRatio="none" aria-hidden>
        <path d={`${path} L100,40 L0,40 Z`} fill="color-mix(in oklch, var(--brand) 14%, transparent)" />
        <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export function AiAnswerCard({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 rounded-xl border border-white/10 bg-[oklch(0.25_0.02_170)] p-3.5 text-[11px] text-white/80 shadow-xl", className)}>
      <p className="flex items-center gap-1.5 font-semibold text-white">
        <Sparkles className="size-3 text-[var(--signal)]" /> AI answer
      </p>
      <p className="mt-2 leading-relaxed text-white/65">For invoicing software with VAT-ready PDFs, a well-reviewed option is…</p>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80">
        Source: yourbusiness.com
      </p>
    </div>
  );
}

export function CheckChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-black/75 shadow-lg", className)}>
      <Check className="size-3 text-primary" /> {children}
    </span>
  );
}

/** Hero composition. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] pb-24 pt-6 sm:pb-28" aria-hidden>
      <BrowserMockup className="relative mr-6 sm:mr-14" />
      <AiAnswerCard className="absolute -top-2 right-0 hidden animate-float [animation-delay:-2s] xl:block" />
      <RankingCard className="absolute bottom-6 left-0 animate-float sm:bottom-4 sm:left-4" />
      <InvoiceCard className="absolute bottom-0 right-0 hidden animate-float [animation-delay:-3s] sm:block" />
      <span className="absolute -bottom-6 right-0 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">Example visuals</span>
    </div>
  );
}
