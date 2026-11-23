import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Cookie-less anonymous client for public website content (cacheable, RLS applies as `anon`). */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
