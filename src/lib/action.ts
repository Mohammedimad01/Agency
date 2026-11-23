import "server-only";
import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { getTeamContext, getClientContext, type TeamContext, type ClientContext } from "@/lib/auth/session";
import type { Permission } from "@/lib/permissions";

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** An error whose message is safe to show to the user. */
export class ActionError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

const PG_MESSAGES: Record<string, string> = {
  "42501": "You don't have permission to do that.",
  "23505": "A record with these details already exists.",
  "23503": "This record is linked to other data and can't be changed that way.",
  "23502": "A required field is missing.",
  "22P02": "Some of the submitted values are invalid.",
  PGRST116: "Record not found.",
};

/** Converts a Postgres/PostgREST error into a user-facing ActionError. */
export function dbError(error: PostgrestError | null | undefined, fallback = "Something went wrong. Please try again."): never {
  if (!error) throw new ActionError(fallback);
  // Business-rule violations raised by our own triggers/functions carry readable messages.
  if ((error.code === "P0001" || error.code === "23514" || error.code === "P0002") && error.message) {
    throw new ActionError(error.message.replace(/^ERROR:\s*/, ""));
  }
  if (error.code === "42501" && /row-level security/i.test(error.message)) {
    throw new ActionError(PG_MESSAGES["42501"]!);
  }
  if (error.code === "42501" && error.message) throw new ActionError(error.message);
  if (error.code === "23514") throw new ActionError("Some values fall outside the allowed range.");
  const known = error.code ? PG_MESSAGES[error.code] : undefined;
  console.error("[db]", error.code, error.message, error.details);
  throw new ActionError(known ?? fallback);
}

export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const flat = z.flattenError(result.error);
    throw new ActionError(flat.formErrors[0] ?? "Please check the highlighted fields.", flat.fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message };
  } catch (err) {
    // Let Next.js redirects / notFound propagate
    if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: unknown }).digest === "string") {
      const digest = (err as { digest: string }).digest;
      if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND") throw err;
    }
    if (err instanceof ActionError) return { ok: false, error: err.message, fieldErrors: err.fieldErrors };
    console.error("[action]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Server action wrapper for team members (optionally requiring a permission). */
export async function teamAction<T>(
  permission: Permission | null,
  fn: (ctx: TeamContext) => Promise<T>,
  successMessage?: string,
): Promise<ActionResult<T>> {
  return run(async () => {
    const ctx = await getTeamContext();
    if (!ctx) throw new ActionError("Your session has expired. Please sign in again.");
    if (permission && !ctx.can(permission)) throw new ActionError(PG_MESSAGES["42501"]!);
    return fn(ctx);
  }, successMessage);
}

/** Server action wrapper for client-portal users. */
export async function clientAction<T>(fn: (ctx: ClientContext) => Promise<T>, successMessage?: string): Promise<ActionResult<T>> {
  return run(async () => {
    const ctx = await getClientContext();
    if (!ctx) throw new ActionError("Your session has expired. Please sign in again.");
    return fn(ctx);
  }, successMessage);
}

/** Server action wrapper without authentication (public forms). */
export async function publicAction<T>(fn: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> {
  return run(fn, successMessage);
}
