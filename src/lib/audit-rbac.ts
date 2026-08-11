/**
 * Server-side admin gate for audit APIs.
 *
 * The check runs through `has_role()` on the *caller's* RLS-scoped client, so
 * a normal authenticated user can never satisfy it, and privileged code never
 * decides the role from client-supplied data.
 */
export type AuthedContext = {
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (table: string) => any;
  };
  userId: string;
  claims?: { email?: string };
};

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

export async function assertAdmin(context: AuthedContext): Promise<void> {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new ForbiddenError();
}