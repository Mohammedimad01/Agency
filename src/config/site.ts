/**
 * Central brand & business configuration.
 * Rename the agency, swap the logo or change the palette here — never in components.
 * Every value can be overridden with environment variables at deploy time.
 */
const env = (key: string, fallback: string) => process.env[key] || fallback;

export const siteConfig = {
  name: env("NEXT_PUBLIC_AGENCY_NAME", "Erlyst"),
  shortName: env("NEXT_PUBLIC_AGENCY_SHORT_NAME", "Erlyst"),
  tagline: env("NEXT_PUBLIC_AGENCY_TAGLINE", "Websites, software & SEO — built to grow."),
  description: env(
    "NEXT_PUBLIC_AGENCY_DESCRIPTION",
    "Erlyst is a digital studio that designs and builds fast websites, custom apps and business software, and grows them with SEO, AI search optimisation and digital marketing.",
  ),
  url: env("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  /** Logo: a path under /public. When empty, the wordmark is rendered from `name`. */
  logo: {
    src: env("NEXT_PUBLIC_AGENCY_LOGO", ""),
    mark: env("NEXT_PUBLIC_AGENCY_MARK", "E"),
    /** Small line under the wordmark in the site header. */
    subline: env("NEXT_PUBLIC_AGENCY_SUBLINE", "Web · Apps · SEO"),
  },
  /** Brand colours (any CSS colour). Applied as CSS variables in the root layout. */
  colors: {
    brand: env("NEXT_PUBLIC_BRAND_COLOR", "oklch(0.46 0.085 165)"),
    brandForeground: env("NEXT_PUBLIC_BRAND_FOREGROUND", "oklch(0.985 0 0)"),
  },
  contact: {
    email: env("NEXT_PUBLIC_CONTACT_EMAIL", "erlyst.tech@gmail.com"),
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
      "web development agency",
      "web design",
      "e-commerce development",
      "custom web apps",
      "mobile app development",
      "ERP software",
      "invoicing software",
      "SEO services",
      "technical SEO",
      "local SEO",
      "AI search optimization",
      "GEO",
      "AEO",
      "digital marketing",
    ],
    twitterHandle: env("NEXT_PUBLIC_TWITTER_HANDLE", ""),
  },
} as const;

export type SiteConfig = typeof siteConfig;
