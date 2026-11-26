"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ServiceIcon } from "@/components/shared/icon";
import { publicNav } from "@/config/navigation";
import { groupServices, type NavService } from "@/features/website/service-groups";
import { cn } from "@/lib/utils";

export function SiteHeader({ services }: { services: NavService[] }) {
  const pathname = usePathname();
  // Menus are "open for a path": navigating elsewhere closes them without an effect.
  const [mobileOn, setMobileOn] = useState<string | null>(null);
  const [megaOn, setMegaOn] = useState<string | null>(null);
  const mobileOpen = mobileOn === pathname;
  const megaOpen = megaOn === pathname;
  const [scrolled, setScrolled] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { groups, more } = groupServices(services);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMegaOn(null);
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOn(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen]);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOn(pathname);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMegaOn(null), 150);
  };
  const servicesActive = pathname.startsWith("/services");

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-background/90 backdrop-blur transition-colors", scrolled || megaOpen ? "border-border" : "border-transparent")}>
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo subline />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <div ref={megaRef} className="relative" onMouseEnter={openMega} onMouseLeave={scheduleClose}>
            <button
              type="button"
              aria-expanded={megaOpen}
              aria-controls="services-menu"
              onClick={() => (megaOpen ? setMegaOn(null) : openMega())}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground",
                (megaOpen || servicesActive) && "bg-primary/[0.07] text-primary",
              )}
            >
              Services
              <ChevronDown className={cn("size-3.5 transition-transform", megaOpen && "rotate-180")} />
            </button>
            {megaOpen ? (
              <div id="services-menu" className="fixed inset-x-0 top-16 z-50 px-4 sm:px-8">
                <div className="mx-auto max-w-6xl animate-in rounded-2xl border bg-popover p-6 shadow-xl fade-in-0 slide-in-from-top-1 duration-150 sm:p-8">
                  <div className="grid gap-8 md:grid-cols-3">
                    {groups.map((g) => (
                      <div key={g.category}>
                        <p className="mb-4 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <ServiceIcon name={g.icon} className="size-3.5 text-primary" />
                          {g.label}
                        </p>
                        <ul className="grid gap-1">
                          {g.services.map((s) => (
                            <li key={s.slug}>
                              <Link href={`/services/${s.slug}`} className="group -mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-accent">
                                <span className="block text-[15px] font-medium text-foreground group-hover:text-primary">{s.name}</span>
                                {s.summary ? <span className="block text-[13px] text-muted-foreground">{s.summary}</span> : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-5 text-[14px]">
                    {more.map((s) => (
                      <Link key={s.slug} href={`/services/${s.slug}`} className="text-primary hover:underline">
                        {s.name}
                      </Link>
                    ))}
                    <Link href="/services" className="ml-auto inline-flex items-center gap-1 font-medium text-foreground hover:text-primary">
                      All services <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {publicNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("rounded-md px-3 py-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground", active && "text-foreground")}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Client login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/book-a-call">Book a call</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOn(mobileOpen ? null : pathname)} aria-expanded={mobileOpen} aria-label="Toggle menu">
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>
      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-3">
            <button type="button" onClick={() => setMobileServices((v) => !v)} aria-expanded={mobileServices} className="flex items-center justify-between rounded-md px-2 py-2.5 text-left text-[15px]">
              Services
              <ChevronDown className={cn("size-4 transition-transform", mobileServices && "rotate-180")} />
            </button>
            {mobileServices ? (
              <div className="mb-2 grid gap-4 rounded-lg bg-surface p-3">
                {groups.map((g) => (
                  <div key={g.category}>
                    <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
                    {g.services.map((s) => (
                      <Link key={s.slug} href={`/services/${s.slug}`} className="block rounded px-1 py-1.5 text-[14.5px]">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                ))}
                <div>
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">More</p>
                  {more.map((s) => (
                    <Link key={s.slug} href={`/services/${s.slug}`} className="block rounded px-1 py-1.5 text-[14.5px]">
                      {s.name}
                    </Link>
                  ))}
                  <Link href="/services" className="block rounded px-1 py-1.5 text-[14.5px] font-medium text-primary">
                    All services →
                  </Link>
                </div>
              </div>
            ) : null}
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-2.5 text-[15px]">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Client login</Link>
              </Button>
              <Button asChild>
                <Link href="/book-a-call">Book a call</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
