// ─────────────────────────────────────────────────────────────────────────────
// Multi-tenancy helpers. Every company-scoped read goes through one of these:
//   • demoCompanyDoc   — the seeded demo workspace (shared, judges' entry)
//   • myCompanyDoc     — company of the authenticated user (query/mutation ctx)
//   • companyForInbox  — company owning a given AgentMail inbox id (webhook)
// Anonymous callers never inherit the demo workspace. Users without a
// membership row who are not the demo account get null → the client shows
// onboarding instead of someone else's data.
// ─────────────────────────────────────────────────────────────────────────────

import { ConvexError } from "convex/values";
import { requireIdentity } from "../model/auth";

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
    .withIndex("by_isDemo", (q: any) => q.eq("isDemo", true))
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
  if (!userId) return null;
  const member = await ctx.db
    .query("members")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
  if (member) return await ctx.db.get(member.companyId);
  const authUser = await ctx.db.get(userId);
  if ((authUser as any)?.email === DEMO_EMAIL) return await demoCompanyDoc(ctx);
  return null;
}

/** Authenticated caller's workspace, or a safe error before any side effect. */
export async function requireMyCompanyDoc(ctx: Ctx) {
  await requireIdentity(ctx as any);
  const company = await myCompanyDoc(ctx);
  if (!company) {
    throw new ConvexError({ code: "WORKSPACE_NOT_FOUND", status: 404 });
  }
  return company;
}

/** Only the authenticated shared demo account may operate the demo runner. */
export async function requireDemoCompanyDoc(ctx: Ctx) {
  const company = await requireMyCompanyDoc(ctx);
  if (!company.isDemo) {
    throw new ConvexError({ code: "DEMO_ONLY", status: 403 });
  }
  return company;
}

/** Company whose agent inbox received a message (webhook/poll path). */
export async function companyForInbox(ctx: Ctx, inboxId: string) {
  return await ctx.db
    .query("companies")
    .withIndex("by_agentInbox", (q: any) => q.eq("agentInbox", inboxId))
    .first();
}
