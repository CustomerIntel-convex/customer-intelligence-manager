import { ConvexError } from "convex/values";

type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<
      | ({ subject: string; email?: string | null } & Record<string, unknown>)
      | null
    >;
  };
};

/** Require a real Convex Auth session for every public write and private read. */
export async function requireIdentity(ctx: AuthContext) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", status: 401 });
  }
  return identity;
}

/** Canonical owner check for documents that store the auth subject directly. */
export async function requireOwner<T extends { ownerId: string }>(
  ctx: AuthContext,
  doc: T | null
): Promise<T> {
  if (!doc) throw new ConvexError({ code: "NOT_FOUND", status: 404 });
  const identity = await requireIdentity(ctx);
  const [userId] = identity.subject.split("|");
  if (doc.ownerId !== userId) {
    throw new ConvexError({ code: "FORBIDDEN", status: 403 });
  }
  return doc;
}
