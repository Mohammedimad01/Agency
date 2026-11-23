import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-[12px] text-muted-foreground">© {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
      <div className="dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col lg:justify-end lg:p-14">
        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <p className="relative max-w-md font-display text-[2.6rem] leading-[1.05] tracking-tight">Every project, file, approval and invoice — in one calm place.</p>
        <p className="relative mt-5 max-w-sm text-sm text-muted-foreground">The {siteConfig.name} workspace for our team and our clients.</p>
      </div>
    </div>
  );
}
