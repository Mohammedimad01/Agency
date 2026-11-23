"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type ClientActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Runs a server action with pending state, toasts and a router refresh.
 * Returns the result so callers can react (close dialogs, map field errors...).
 */
export function useServerAction() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function execute<T>(
    action: () => Promise<ClientActionResult<T>>,
    opts: { success?: string; refresh?: boolean; onSuccess?: (data: T) => void; onError?: (r: Extract<ClientActionResult<T>, { ok: false }>) => void } = {},
  ) {
    return new Promise<ClientActionResult<T>>((resolve) => {
      startTransition(async () => {
        try {
          const result = await action();
          if (result.ok) {
            const msg = opts.success ?? result.message;
            if (msg) toast.success(msg);
            opts.onSuccess?.(result.data);
            if (opts.refresh !== false) router.refresh();
          } else {
            toast.error(result.error);
            opts.onError?.(result);
          }
          resolve(result);
        } catch (e) {
          // Redirect errors from server actions are handled by Next.js
          if (e && typeof e === "object" && "digest" in e) throw e;
          toast.error("Network error. Please try again.");
          resolve({ ok: false, error: "Network error" });
        }
      });
    });
  }

  return { pending, execute };
}
