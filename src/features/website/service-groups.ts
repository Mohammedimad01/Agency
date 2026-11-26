import { MORE_SERVICES_CATEGORY, SERVICE_GROUPS } from "@/config/navigation";

export interface NavService {
  slug: string;
  name: string;
  summary: string | null;
  icon: string | null;
  category: string;
}

/** Groups services into the configured columns; anything uncategorised falls into "More services". */
export function groupServices<T extends NavService>(services: T[]) {
  const known = new Set<string>(SERVICE_GROUPS.map((g) => g.category));
  const groups = SERVICE_GROUPS.map((g) => ({ ...g, services: services.filter((s) => s.category === g.category) })).filter((g) => g.services.length);
  const more = services.filter((s) => !known.has(s.category) || s.category === MORE_SERVICES_CATEGORY);
  return { groups, more };
}
