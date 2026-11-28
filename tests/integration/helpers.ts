import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Integration tests run against a LOCAL Supabase stack loaded with the test fixture
 * (`npm run db:test-data`). Credentials come from the environment — nothing is hard-coded:
 *   eval "$(npx supabase status -o env | sed 's/^/export /')" (gives API_URL, ANON_KEY, SERVICE_ROLE_KEY)
 *   export TEST_USER_PASSWORD=...  (same value used when loading the fixture)
 * Without them the integration suites are skipped.
 */
export const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.API_URL ?? "";
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.ANON_KEY ?? "";
export const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY ?? "";
export const PASSWORD = process.env.TEST_USER_PASSWORD ?? "";

export type DB = SupabaseClient<Database>;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin = () => createClient<Database>(URL, SERVICE, opts);
export const anon = () => createClient<Database>(URL, ANON, opts);

export async function signIn(email: string, password = PASSWORD): Promise<DB> {
  const c = createClient<Database>(URL, ANON, opts);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return c;
}

export async function stackAvailable() {
  if (!URL || !ANON || !SERVICE || !PASSWORD) return false;
  try {
    const r = await fetch(`${URL}/rest/v1/`, { headers: { apikey: ANON } });
    return r.ok || r.status === 404;
  } catch {
    return false;
  }
}

export const uid = () => Math.random().toString(36).slice(2, 8);

/** Creates a confirmed user (local testing only) and returns its id. */
export async function createUser(email: string, fullName: string) {
  const { data, error } = await admin().auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error) throw error;
  return data.user.id;
}
