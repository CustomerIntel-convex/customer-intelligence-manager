// ─────────────────────────────────────────────────────────────────────────────
// Multi-tenancy helpers. Every company-scoped read goes through one of these:
//   • demoCompanyDoc   — the seeded demo workspace (shared, judges' entry)
//   • myCompanyDoc     — company of the authenticated user (query/mutation ctx)
//   • companyForInbox  — company owning a given AgentMail inbox id (webhook)
// Users without a membership row who are not the demo account get null →
// the client shows onboarding instead of someone else's data.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_EMAIL = "demo@customer-intel.app";

type Ctx = { db: any; auth?: any };

/** Convex Auth puts the user id in the identity subject. */
export async function currentUserId(ctx: Ctx): Promise<string | null> {
  const identity = await ctx.auth?.getUserIdentity?.();
  return identity?.subject ?? null;
}

/** The demo workspace: flagged with isDemo, else the oldest company. */
export async function demoCompanyDoc(ctx: Ctx) {
  const flagged = await ctx.db
    .query("companies")
    .filter((q: any) => q.eq(q.field("isDemo"), true))
    .first();
  if (flagged) return flagged;
  return await ctx.db.query("companies").first();
}

/**
 * Company for the calling authenticated user (query/mutation context).
 * - member row → that company
 * - demo account without a member row yet → demo company (lazy, no write)
 * - anyone else without a workspace → null (client shows onboarding)
 */
export async function myCompanyDoc(ctx: Ctx) {
  const userId = await currentUserId(ctx);
  if (!userId) return await demoCompanyDoc(ctx);
  const member = await ctx.db
    .query("members")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
  if (member) return await ctx.db.get(member.companyId);
  const authUser = await ctx.db.get(userId);
  if ((authUser as any)?.email === DEMO_EMAIL) return await demoCompanyDoc(ctx);
  return null;
}

/** Company whose agent inbox received a message (webhook/poll path). */
export async function companyForInbox(ctx: Ctx, inboxId: string) {
  return await ctx.db
    .query("companies")
    .filter((q: any) => q.eq(q.field("agentInbox"), inboxId))
    .first();
}
