"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote, CalendarDays, ChartColumn, FileText, FolderKanban, Globe, Inbox, Layers, LayoutDashboard, LayoutTemplate,
  MessagesSquare, PanelLeft, Receipt, Settings, Signature, Users, Wallet, Building, ChartLine,
} from "lucide-react";
import type { AdminNavIcon, AdminNavItem } from "@/config/admin-nav";
import { Logo } from "@/components/shared/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminNavIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard, leads: Inbox, clients: Building, projects: FolderKanban, templates: LayoutTemplate,
  services: Layers, proposals: FileText, contracts: Signature, finance: ChartLine, invoices: Receipt, payments: Banknote,
  expenses: Wallet, reports: ChartColumn, team: Users, messages: MessagesSquare, website: Globe, settings: Settings, meetings: CalendarDays,
};

export function SidebarNav({ groups, collapsed, onNavigate, badges }: { groups: { label: string; items: AdminNavItem[] }[]; collapsed?: boolean; onNavigate?: () => void; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : href === "/admin/finance" ? pathname === "/admin/finance" : pathname.startsWith(href));
  return (
    <nav className="flex flex-col gap-5 px-3" aria-label="Admin">
      {groups.map((g) => (
        <div key={g.label}>
          {!collapsed ? <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{g.label}</p> : <div className="mx-2 mb-2 h-px bg-sidebar-border" />}
          <ul className="grid gap-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item.href);
              const badge = badges?.[item.href];
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-md px-2 text-[13.5px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                    active && "bg-sidebar-accent font-medium text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                  {!collapsed && badge ? <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary tabular">{badge}</span> : null}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ groups, collapsed, onToggle, orgName, badges }: { groups: { label: string; items: AdminNavItem[] }[]; collapsed: boolean; onToggle: () => void; orgName: string; badges?: Record<string, number> }) {
  return (
    <aside className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-[60px]" : "w-[232px]")}>
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-0")}>
        <Logo href="/admin" compact={collapsed} />
      </div>
      {!collapsed ? <p className="px-5 pt-3 text-[11.5px] text-muted-foreground">{orgName} workspace</p> : null}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav groups={groups} collapsed={collapsed} badges={badges} />
      </div>
      <div className="border-t p-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", collapsed && "justify-center px-0")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="size-4" />
          {!collapsed ? "Collapse" : null}
        </button>
      </div>
    </aside>
  );
}
