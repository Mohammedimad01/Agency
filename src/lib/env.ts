import "server-only";

/** Server-side environment access with clear errors for missing configuration. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See docs/ENVIRONMENT.md.`);
  }
  return value;
}

export const serverEnv = {
  get supabaseUrl() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get serviceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get cronSecret() {
    return requireEnv("CRON_SECRET");
  },
  get appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  emailProvider: (process.env.EMAIL_PROVIDER ?? (process.env.RESEND_API_KEY ? "resend" : "console")) as "resend" | "console",
};

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
