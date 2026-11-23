"use client";
import { useState, useSyncExternalStore } from "react";
import { Menu } from "lucide-react";
import type { AdminNavItem } from "@/config/admin-nav";
import { AdminSidebar, SidebarNav } from "./sidebar";
import { CommandSearch } from "./command-search";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserMenu } from "@/components/shared/user-menu";
import { ThemeToggle } from "@/components/shared/theme";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

/** Persisted sidebar preference (per browser). */
const KEY = "admin.sidebar.collapsed";
const listeners = new Set<() => void>();
const sidebarStore = {
  get: () => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  },
  set: (v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function AdminShell({
  groups,
  user,
  orgName,
  badges,
  children,
}: {
  groups: { label: string; items: AdminNavItem[] }[];
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
  orgName: string;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(sidebarStore.subscribe, sidebarStore.get, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => sidebarStore.set(!collapsed);

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar groups={groups} collapsed={collapsed} onToggle={toggle} orgName={orgName} badges={badges} />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[264px] p-0 pt-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="px-5 pb-4">
            <Logo href="/admin" />
          </div>
          <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} badges={badges} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="flex-1">
            <CommandSearch nav={groups.flatMap((g) => g.items)} />
          </div>
          <ThemeToggle />
          <NotificationBell userId={user.id} allHref="/admin/notifications" />
          <UserMenu name={user.name} email={user.email} avatar={user.avatar} role={user.role} settingsHref="/admin/settings" />
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
