"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/documents", label: "Documents" },
  { href: "/portal/messages", label: "Messages" },
];

export function PortalShell({ user, clientName, agencyName, children }: { user: { id: string; name: string; email: string; avatar: string | null }; clientName: string; agencyName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/portal" ? pathname === "/portal" : pathname.startsWith(href));
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo href="/portal" />
          <span className="hidden text-muted-foreground/50 sm:inline">/</span>
          <span className="hidden truncate text-[13.5px] font-medium sm:inline">{clientName}</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell userId={user.id} allHref="/portal/notifications" />
            <UserMenu name={user.name} email={user.email} avatar={user.avatar} role={`Client of ${agencyName}`} settingsHref="/portal/settings" />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-5" aria-label="Portal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className={cn("-mb-px shrink-0 border-b-2 border-transparent px-3 pb-2.5 pt-1 text-[13.5px] text-muted-foreground hover:text-foreground", active(n.href) && "border-primary font-medium text-foreground")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
