/** Permission keys — must match public.permissions (the database is authoritative). */
export const PERMISSIONS = [
  "dashboard.view",
  "leads.view",
  "leads.manage",
  "clients.view",
  "clients.manage",
  "projects.view_all",
  "projects.manage",
  "templates.manage",
  "services.manage",
  "content.manage",
  "proposals.view",
  "proposals.manage",
  "contracts.view",
  "contracts.manage",
  "finance.view",
  "finance.manage",
  "reports.view",
  "reports.finance",
  "team.view",
  "team.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const TEAM_ROLES = ["owner", "admin", "project_manager", "finance_manager", "analyst", "developer", "designer"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const ROLE_LABELS: Record<TeamRole | "client", string> = {
  owner: "Owner",
  admin: "Administrator",
  project_manager: "Project Manager",
  finance_manager: "Finance Manager",
  analyst: "Analyst",
  developer: "Developer",
  designer: "Designer",
  client: "Client",
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
