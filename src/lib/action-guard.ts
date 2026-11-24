import type { ActionState } from "@/lib/action-state";

// redirect() and notFound() work by throwing; those must keep propagating.
const isNextControlFlow = (e: unknown) =>
  typeof e === "object" && e !== null && String((e as { digest?: unknown }).digest ?? "").startsWith("NEXT_");

/**
 * Wraps a server action body so an unexpected failure (database down, timeout…) becomes a
 * readable form error instead of crashing the page. Expected failures (validation,
 * permissions) are returned by the action itself and never reach this.
 */
export async function guardAction(run: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await run();
  } catch (e) {
    if (isNextControlFlow(e)) throw e;
    console.error("Server action failed", e);
    return { error: "Something went wrong. Please try again." };
  }
}
