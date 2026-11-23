import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { serverEnv } from "@/lib/env";

/**
 * Service-role client. BYPASSES RLS — use only on the server, only after an
 * explicit authorization check, and only for operations that genuinely need it
 * (auth admin, signed storage URLs, public form intake, outbox dispatch).
 */
export function createAdminClient() {
  return createClient<Database>(serverEnv.supabaseUrl, serverEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminSupabase = ReturnType<typeof createAdminClient>;
