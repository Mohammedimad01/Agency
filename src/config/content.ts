/**
 * Built-in website content. The public site uses the database when Supabase is
 * configured and has content; otherwise it falls back to these values, so the
 * marketing site is fully usable before the backend is deployed.
 * The service list mirrors supabase/migrations/20261126000100_service_catalogue_v2.sql.
 */
export interface StaticService {
  slug: string;
  name: string;
  category: string;
  icon: string;
  summary: string;
  description: string;
  delivery_time: string;
  deliverables: string[];
  sort_order: number;
  /** Starting price in minor units (e.g. cents). Leave null to show "Fixed quote". */
  starting_price_cents: number | null;
}

export const STATIC_SERVICES: StaticService[] = [
  {
    "slug": "website-development",
    "name": "Web development",
    "category": "Websites",
    "icon": "globe",
    "summary": "Fast, SEO-ready business sites",
    "description": "High-performance business websites built on a modern stack: fast on every device, structured for search engines from day one, and easy for your team to update.",
    "delivery_time": "3–6 weeks",
    "deliverables": [
      "Responsive website",
      "CMS your team can edit",
      "On-page SEO foundation",
      "Analytics & Search Console",
      "Launch support"
    ],
    "sort_order": 1,
    "starting_price_cents": null
  },
  {
    "slug": "web-design",
    "name": "Web design",
    "category": "Websites",
    "icon": "palette",
    "summary": "Clean, conversion-focused design",
    "description": "Distinctive, on-brand website design that guides visitors to act: clear messaging, strong hierarchy and calls to action that convert.",
    "delivery_time": "2–4 weeks",
    "deliverables": [
      "Sitemap & wireframes",
      "Visual design system",
      "Responsive page designs",
      "Conversion-focused copy structure",
      "Developer-ready handoff"
    ],
    "sort_order": 2,
    "starting_price_cents": null
  },
  {
    "slug": "ecommerce",
    "name": "E-commerce",
    "category": "Websites",
    "icon": "shopping-cart",
    "summary": "Online stores that sell",
    "description": "Online stores that load fast, rank well and make buying effortless — with payments, shipping, inventory and analytics set up properly.",
    "delivery_time": "4–8 weeks",
    "deliverables": [
      "Store design & build",
      "Payment & shipping setup",
      "Product catalogue import",
      "Conversion tracking",
      "Training & launch"
    ],
    "sort_order": 3,
    "starting_price_cents": null
  },
  {
    "slug": "ui-ux-design",
    "name": "UI/UX design",
    "category": "Websites",
    "icon": "pen-tool",
    "summary": "Interfaces people understand",
    "description": "Research-led product and interface design: user flows, wireframes, prototypes and design systems that make complex software feel simple.",
    "delivery_time": "3–6 weeks",
    "deliverables": [
      "User research & flows",
      "Wireframes",
      "High-fidelity UI",
      "Interactive prototype",
      "Design system"
    ],
    "sort_order": 4,
    "starting_price_cents": null
  },
  {
    "slug": "custom-web-apps",
    "name": "Custom web apps",
    "category": "Custom apps & software",
    "icon": "app-window",
    "summary": "Portals, dashboards, tools",
    "description": "Secure web applications built around your process — client portals, internal dashboards and tools that replace spreadsheets and manual work.",
    "delivery_time": "6–14 weeks",
    "deliverables": [
      "Product specification",
      "Web application",
      "Admin panel",
      "Automated tests",
      "Deployment & handover"
    ],
    "sort_order": 5,
    "starting_price_cents": null
  },
  {
    "slug": "mobile-apps",
    "name": "Mobile apps",
    "category": "Custom apps & software",
    "icon": "smartphone",
    "summary": "iOS and Android",
    "description": "Cross-platform mobile apps for iOS and Android with a single codebase, offline support and App Store / Play Store publishing.",
    "delivery_time": "8–16 weeks",
    "deliverables": [
      "App design",
      "iOS & Android apps",
      "Backend & API",
      "Store publishing",
      "Analytics & crash reporting"
    ],
    "sort_order": 6,
    "starting_price_cents": null
  },
  {
    "slug": "business-software",
    "name": "Business software",
    "category": "Custom apps & software",
    "icon": "briefcase",
    "summary": "Built around your workflow",
    "description": "Custom business systems for operations, sales, HR or logistics — built around how your team actually works, not the other way round.",
    "delivery_time": "Scoped per project",
    "deliverables": [
      "Process discovery",
      "System architecture",
      "Custom software",
      "Integrations",
      "Training & support"
    ],
    "sort_order": 7,
    "starting_price_cents": null
  },
  {
    "slug": "invoicing-apps",
    "name": "Invoicing apps",
    "category": "Custom apps & software",
    "icon": "receipt-text",
    "summary": "VAT-ready, branded PDFs",
    "description": "Invoicing software with VAT-compliant numbering, branded PDF invoices, payment tracking and reminders — tailored to your business.",
    "delivery_time": "3–6 weeks",
    "deliverables": [
      "VAT-ready invoicing",
      "Branded PDF templates",
      "Payment tracking",
      "Automated reminders",
      "Reports & exports"
    ],
    "sort_order": 8,
    "starting_price_cents": null
  },
  {
    "slug": "quotation-apps",
    "name": "Quotation apps",
    "category": "Custom apps & software",
    "icon": "file-text",
    "summary": "Quote to invoice in one flow",
    "description": "Create professional quotes in minutes, get them approved online and convert them to invoices in one click — no retyping.",
    "delivery_time": "3–6 weeks",
    "deliverables": [
      "Quote builder",
      "Product & price catalogue",
      "Online approval",
      "Quote-to-invoice conversion",
      "Sales reporting"
    ],
    "sort_order": 9,
    "starting_price_cents": null
  },
  {
    "slug": "erp-software",
    "name": "ERP software",
    "category": "Custom apps & software",
    "icon": "boxes",
    "summary": "Operations in one system",
    "description": "One system for inventory, purchasing, sales, finance and people — replacing disconnected tools with a single source of truth.",
    "delivery_time": "12+ weeks",
    "deliverables": [
      "Requirements & process mapping",
      "Core ERP modules",
      "Data migration",
      "Integrations",
      "Rollout & training"
    ],
    "sort_order": 10,
    "starting_price_cents": null
  },
  {
    "slug": "seo-services",
    "name": "SEO services",
    "category": "SEO & growth",
    "icon": "search",
    "summary": "Rank for the searches that pay",
    "description": "Strategy-led SEO that targets the searches your buyers actually make — keyword research, content, on-page optimisation and link building with monthly reporting.",
    "delivery_time": "Ongoing (monthly)",
    "deliverables": [
      "SEO audit & strategy",
      "Keyword research",
      "On-page optimisation",
      "Content plan",
      "Monthly reporting"
    ],
    "sort_order": 11,
    "starting_price_cents": null
  },
  {
    "slug": "google-search-console",
    "name": "Google Search Console setup",
    "category": "SEO & growth",
    "icon": "search-check",
    "summary": "Get indexed and measured fast",
    "description": "Verification, sitemaps, indexing fixes and performance tracking in Google Search Console — so Google finds your site and you can measure results.",
    "delivery_time": "1 week",
    "deliverables": [
      "Property verification",
      "Sitemap submission",
      "Indexing issue fixes",
      "Analytics integration",
      "Performance baseline report"
    ],
    "sort_order": 12,
    "starting_price_cents": null
  },
  {
    "slug": "technical-seo",
    "name": "Technical SEO",
    "category": "SEO & growth",
    "icon": "gauge",
    "summary": "Speed, schema, crawlability",
    "description": "Core Web Vitals, structured data, crawlability and site architecture fixes that remove the technical barriers between you and better rankings.",
    "delivery_time": "2–4 weeks",
    "deliverables": [
      "Technical audit",
      "Core Web Vitals fixes",
      "Schema markup",
      "Crawl & index fixes",
      "Re-audit report"
    ],
    "sort_order": 13,
    "starting_price_cents": null
  },
  {
    "slug": "ai-search-optimization",
    "name": "AI search (GEO and AEO)",
    "category": "SEO & growth",
    "icon": "sparkles",
    "summary": "Be the answer, not just a link",
    "description": "Generative and answer engine optimisation so ChatGPT, Gemini, Perplexity and Google AI Overviews cite your business when customers ask.",
    "delivery_time": "Ongoing (monthly)",
    "deliverables": [
      "AI visibility audit",
      "Entity & schema optimisation",
      "Answer-first content",
      "Citation building",
      "AI search monitoring"
    ],
    "sort_order": 14,
    "starting_price_cents": null
  },
  {
    "slug": "local-seo",
    "name": "Local SEO",
    "category": "SEO & growth",
    "icon": "map-pin",
    "summary": "Maps and near-me searches",
    "description": "Google Business Profile optimisation, local citations and reviews strategy so you show up in maps and near-me searches.",
    "delivery_time": "Ongoing (monthly)",
    "deliverables": [
      "Google Business Profile",
      "Local citations",
      "Review strategy",
      "Location pages",
      "Local rank tracking"
    ],
    "sort_order": 15,
    "starting_price_cents": null
  },
  {
    "slug": "digital-marketing",
    "name": "Digital marketing",
    "category": "SEO & growth",
    "icon": "megaphone",
    "summary": "Search, social and ads",
    "description": "Performance marketing across Google Ads, Meta and LinkedIn — planned, launched and optimised against real revenue, not vanity metrics.",
    "delivery_time": "Ongoing (monthly)",
    "deliverables": [
      "Channel strategy",
      "Campaign setup",
      "Ad creative",
      "Conversion tracking",
      "Monthly optimisation"
    ],
    "sort_order": 16,
    "starting_price_cents": null
  },
  {
    "slug": "ai-automation",
    "name": "AI automation",
    "category": "More services",
    "icon": "bot",
    "summary": "Automate the busywork with AI",
    "description": "AI assistants and automated workflows that connect your tools and take repetitive work off your team — from lead handling to document processing.",
    "delivery_time": "2–8 weeks",
    "deliverables": [
      "Process discovery",
      "AI workflow design",
      "Integrations",
      "Testing & guardrails",
      "Monitoring"
    ],
    "sort_order": 17,
    "starting_price_cents": null
  },
  {
    "slug": "power-bi",
    "name": "Power BI & analytics",
    "category": "More services",
    "icon": "chart-pie",
    "summary": "Dashboards your leadership will use",
    "description": "Power BI dashboards and data models that turn scattered data into one trusted view of the business, refreshed automatically.",
    "delivery_time": "2–6 weeks",
    "deliverables": [
      "Requirements workshop",
      "Data model",
      "Dashboards",
      "Automated refresh",
      "Handover"
    ],
    "sort_order": 18,
    "starting_price_cents": null
  },
  {
    "slug": "branding",
    "name": "Branding",
    "category": "More services",
    "icon": "sparkles",
    "summary": "Identities with clarity and character",
    "description": "Brand strategy, logo and identity systems with guidelines your team and partners can apply consistently.",
    "delivery_time": "3–5 weeks",
    "deliverables": [
      "Brand strategy",
      "Logo suite",
      "Colour & typography",
      "Brand guidelines",
      "Asset kit"
    ],
    "sort_order": 19,
    "starting_price_cents": null
  },
  {
    "slug": "website-maintenance",
    "name": "Website maintenance",
    "category": "More services",
    "icon": "wrench",
    "summary": "Updates, backups, monitoring",
    "description": "Ongoing care for your website: updates, security patches, backups, uptime monitoring and small improvements every month.",
    "delivery_time": "Monthly plan",
    "deliverables": [
      "Updates & patches",
      "Daily backups",
      "Uptime monitoring",
      "Monthly improvements",
      "Priority support"
    ],
    "sort_order": 20,
    "starting_price_cents": null
  },
  {
    "slug": "hosting-infrastructure",
    "name": "Hosting and infrastructure",
    "category": "More services",
    "icon": "server",
    "summary": "Fast, secure, managed hosting",
    "description": "Managed cloud hosting, domains, SSL, CDN and email deliverability — configured for speed and security, monitored around the clock.",
    "delivery_time": "1 week setup",
    "deliverables": [
      "Cloud hosting setup",
      "Domain & DNS",
      "SSL & CDN",
      "Email deliverability",
      "Monitoring & alerts"
    ],
    "sort_order": 21,
    "starting_price_cents": null
  }
];

export const STATIC_FAQS: { question: string; answer: string }[] = [
  { question: "What does GridLab do?", answer: "We design and build business websites, online stores, custom web and mobile apps, and business software such as invoicing, quotation and ERP systems — then help you get found with SEO, local SEO, AI search optimisation and digital marketing." },
  { question: "How do projects start?", answer: "With a free 30-minute call. We learn your goals, budget and timeline, then send a fixed written quote with scope and milestones before any work begins." },
  { question: "How long does a website take?", answer: "Most business websites go live in 3–6 weeks. Online stores and custom software take longer; your quote includes a milestone-by-milestone timeline." },
  { question: "Will my website rank on Google?", answer: "Every site we build is SEO-ready: fast, mobile-first, structured data, sitemap and Google Search Console set up at launch. Ongoing SEO is available if you want to grow traffic further." },
  { question: "What are GEO and AEO?", answer: "Generative and answer engine optimisation: making your business the source that AI assistants such as ChatGPT, Gemini, Perplexity and Google AI Overviews cite when customers ask questions." },
  { question: "Do you build custom apps or only websites?", answer: "Both. We build portals, dashboards, mobile apps, invoicing and quotation tools and ERP systems — built around how your business actually works." },
  { question: "How does payment work?", answer: "Fixed-price projects are usually split into a deposit and milestone payments. Monthly services like SEO, maintenance and hosting are billed monthly." },
  { question: "Who owns the website and code?", answer: "You do. Once the final invoice is paid, the agreed deliverables and source code are yours." },
];

/** "Not sure what you need?" guide on the homepage. */
export const GOAL_GUIDE: { goal: string; start: { label: string; slug: string }[]; then: string }[] = [
  { goal: "Look credible and win enquiries", start: [{ label: "Web development", slug: "website-development" }], then: "SEO services and Google Search Console setup" },
  { goal: "Sell products online", start: [{ label: "E-commerce", slug: "ecommerce" }], then: "Technical SEO and digital marketing" },
  { goal: "Stop writing quotes and invoices by hand", start: [{ label: "Quotation apps", slug: "quotation-apps" }, { label: "Invoicing apps", slug: "invoicing-apps" }], then: "Payment tracking and reporting" },
  { goal: "Run operations from one system", start: [{ label: "ERP software", slug: "erp-software" }, { label: "Custom web apps", slug: "custom-web-apps" }], then: "Training and a support plan" },
  { goal: "Show up in your city on Google", start: [{ label: "Local SEO", slug: "local-seo" }], then: "Google Business Profile and location pages" },
  { goal: "Be recommended by AI assistants", start: [{ label: "AI search (GEO and AEO)", slug: "ai-search-optimization" }], then: "Structured data and answer-first content" },
];

/** Engagement options on the pricing page. Set `price` (display string) once you've decided your public prices. */
export const ENGAGEMENTS: { name: string; summary: string; price: string | null; unit: string; points: string[]; featured?: boolean; cta: string; href: string }[] = [
  {
    name: "Business website",
    summary: "A fast, SEO-ready website that wins enquiries.",
    price: null,
    unit: "one-time",
    points: ["Custom design, mobile-first", "Service pages and lead forms", "On-page SEO and schema", "Search Console and analytics", "30 days of post-launch support"],
    cta: "Get a website quote",
    href: "/contact?type=brief&service=website-development",
  },
  {
    name: "Custom app or software",
    summary: "Portals, invoicing, quotation and ERP systems built around your workflow.",
    price: null,
    unit: "per project",
    points: ["Discovery and written specification", "Milestones you can review", "Admin panel and user roles", "Automated tests and deployment", "Training and handover"],
    featured: true,
    cta: "Scope my project",
    href: "/contact?type=brief&service=custom-web-apps",
  },
  {
    name: "SEO & growth",
    summary: "Get found on Google, in maps and in AI answers.",
    price: null,
    unit: "per month",
    points: ["Technical and on-page SEO", "Local SEO and Google Business Profile", "AI search (GEO and AEO)", "Content plan", "Monthly report in plain language"],
    cta: "Get an SEO plan",
    href: "/contact?type=brief&service=seo-services",
  },
];
