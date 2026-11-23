import type { Permission } from "@/lib/permissions";

export type AdminNavIcon =
  | "dashboard" | "leads" | "clients" | "projects" | "templates" | "services" | "proposals" | "contracts"
  | "finance" | "invoices" | "payments" | "expenses" | "reports" | "team" | "messages" | "website" | "settings" | "meetings";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: AdminNavIcon;
  permission?: Permission;
}

export const adminNav: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard", permission: "dashboard.view" },
      { href: "/admin/messages", label: "Messages", icon: "messages" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/leads", label: "Leads", icon: "leads", permission: "leads.view" },
      { href: "/admin/meetings", label: "Meetings", icon: "meetings", permission: "leads.view" },
      { href: "/admin/clients", label: "Clients", icon: "clients", permission: "clients.view" },
      { href: "/admin/proposals", label: "Proposals", icon: "proposals", permission: "proposals.view" },
      { href: "/admin/contracts", label: "Contracts", icon: "contracts", permission: "contracts.view" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "projects" },
      { href: "/admin/templates", label: "Templates", icon: "templates", permission: "templates.manage" },
      { href: "/admin/services", label: "Services", icon: "services", permission: "services.manage" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance", label: "Overview", icon: "finance", permission: "finance.view" },
      { href: "/admin/finance/invoices", label: "Invoices", icon: "invoices", permission: "finance.view" },
      { href: "/admin/finance/payments", label: "Payments", icon: "payments", permission: "finance.view" },
      { href: "/admin/finance/expenses", label: "Expenses", icon: "expenses", permission: "finance.view" },
      { href: "/admin/reports", label: "Reports", icon: "reports", permission: "reports.view" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/admin/team", label: "Team", icon: "team", permission: "team.view" },
      { href: "/admin/website", label: "Website", icon: "website", permission: "content.manage" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
    ],
  },
];
