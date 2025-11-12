import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password({ reset: ResendOTPPasswordReset }), Google, GitHub],
});

export const loggedInUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

export const updateUserName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    await ctx.db.patch(userId, { name: args.name });
    return { success: true };
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { name, image }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const patchData: { name?: string; image?: string } = {};
    if (name) patchData.name = name;
    if (image) patchData.image = image;

    if (Object.keys(patchData).length > 0) {
      await ctx.db.patch(userId, patchData);
    }

    return { success: true };
  },
});
