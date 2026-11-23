/**
 * Central brand & business configuration.
 * Rename the agency, swap the logo or change the palette here — never in components.
 * Every value can be overridden with environment variables at deploy time.
 */
const env = (key: string, fallback: string) => process.env[key] || fallback;

export const siteConfig = {
  name: env("NEXT_PUBLIC_AGENCY_NAME", "Bismillah"),
  shortName: env("NEXT_PUBLIC_AGENCY_SHORT_NAME", "Bismillah"),
  tagline: env("NEXT_PUBLIC_AGENCY_TAGLINE", "Digital products, data and AI — built with care."),
  description: env(
    "NEXT_PUBLIC_AGENCY_DESCRIPTION",
    "A digital solutions studio crafting websites, web applications, brands, business intelligence and AI-powered systems for ambitious teams.",
  ),
  url: env("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  /** Logo: a path under /public. When empty, the wordmark is rendered from `name`. */
  logo: { src: env("NEXT_PUBLIC_AGENCY_LOGO", ""), mark: env("NEXT_PUBLIC_AGENCY_MARK", "B") },
  /** Brand colours (any CSS colour). Applied as CSS variables in the root layout. */
  colors: {
    brand: env("NEXT_PUBLIC_BRAND_COLOR", "oklch(0.46 0.085 165)"),
    brandForeground: env("NEXT_PUBLIC_BRAND_FOREGROUND", "oklch(0.985 0 0)"),
  },
  contact: {
    email: env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@bismillah.studio"),
    phone: env("NEXT_PUBLIC_CONTACT_PHONE", "+971 50 000 0000"),
    address: env("NEXT_PUBLIC_CONTACT_ADDRESS", "Dubai, United Arab Emirates"),
    hours: env("NEXT_PUBLIC_CONTACT_HOURS", "Sun–Thu, 9:00–18:00 GST"),
  },
  social: {
    linkedin: env("NEXT_PUBLIC_SOCIAL_LINKEDIN", "https://www.linkedin.com"),
    instagram: env("NEXT_PUBLIC_SOCIAL_INSTAGRAM", "https://www.instagram.com"),
    x: env("NEXT_PUBLIC_SOCIAL_X", "https://x.com"),
    github: env("NEXT_PUBLIC_SOCIAL_GITHUB", "https://github.com"),
  },
  /** Display defaults; per-organization values in the `settings` table take precedence for documents. */
  locale: env("NEXT_PUBLIC_LOCALE", "en-US"),
  currency: env("NEXT_PUBLIC_DEFAULT_CURRENCY", "USD"),
  timeZone: env("NEXT_PUBLIC_DEFAULT_TIMEZONE", "Asia/Dubai"),
  /** External scheduling link (Cal.com, Calendly…). When empty, the built-in request form is used. */
  bookingUrl: env("NEXT_PUBLIC_BOOKING_URL", ""),
  /** Organization whose content the public website shows (slug). Defaults to the first organization. */
  organizationSlug: env("NEXT_PUBLIC_ORGANIZATION_SLUG", ""),
  seo: {
    keywords: [
      "digital agency",
      "web development",
      "web applications",
      "UI/UX design",
      "branding",
      "Power BI",
      "business intelligence",
      "AI solutions",
      "automation",
    ],
    twitterHandle: env("NEXT_PUBLIC_TWITTER_HANDLE", ""),
  },
} as const;

export type SiteConfig = typeof siteConfig;
