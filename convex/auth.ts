import { convexAuth } from "@convex-dev/auth/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

/** Who is signed in (display info only — demo single-seat app). */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    return {
      email: ((user as any)?.email ?? identity.email ?? "signed in").slice(0, 40),
      name: ((user as any)?.name ?? identity.name ?? "Team") as string,
    };
  },
});
