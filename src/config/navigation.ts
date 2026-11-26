export const publicNav = [
  { href: "/portfolio", label: "Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Service groups shown in the header mega-menu, on /services and on the homepage.
 * A service belongs to a group through its `category` (editable in Admin → Services).
 * The `More services` group is shown as a single row of links under the columns.
 */
export const SERVICE_GROUPS = [
  { category: "Websites", label: "Websites", icon: "layout-template", blurb: "Sites and stores that load fast, rank and convert." },
  { category: "Custom apps & software", label: "Custom apps & software", icon: "code-xml", blurb: "Software built around how your business works." },
  { category: "SEO & growth", label: "SEO & growth", icon: "trending-up", blurb: "Get found on Google, in maps and in AI answers." },
] as const;

export const MORE_SERVICES_CATEGORY = "More services";
