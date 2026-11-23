"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { publicNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-background/90 backdrop-blur transition-colors", scrolled ? "border-border" : "border-transparent")}>
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
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
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open ? (
        <div className="border-t bg-background md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-3">
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
