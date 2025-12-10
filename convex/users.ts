import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const updateUserStripeCustomerIdMutation = internalMutation({
  args: { userId: v.id("users"), stripeCustomerId: v.string() },
  handler: async (ctx, { userId, stripeCustomerId }) => {
    await ctx.db.patch(userId, { stripeCustomerId });
  },
});

export const getMe = internalQuery({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const getUserByStripeCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId),
      )
      .unique();
  },
});

export const updateUserSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
      v.literal("enterprise"),
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("unpaid"),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    await ctx.db.patch(userId, {
      stripeCustomerId: rest.stripeCustomerId,
      stripePriceId: rest.stripePriceId,
      stripeSubscriptionId: rest.stripeSubscriptionId,
      subscriptionStatus: rest.subscriptionStatus,
      subscriptionTier: rest.subscriptionTier,
    });
  },
});

// Update user subscription
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
      v.literal("enterprise"),
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
    ),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
  },
});

export const getRole = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      return null;
    }

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", user._id),
      )
      .unique();

    return member ? member.role : null;
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    notifications: v.object({
      emailOnResponse: v.optional(v.boolean()),
      weeklySummary: v.optional(v.boolean()),
      productUpdates: v.optional(v.boolean()),
      marketingEmails: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a viewer in their active workspace
    if (user.activeWorkspaceId) {
      const member = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace_and_user", (q) =>
          q.eq("workspaceId", user.activeWorkspaceId!).eq("userId", userId)
        )
        .first();
      
      if (member?.role === "viewer") {
        throw new ConvexError("Viewers cannot modify notification settings. Please contact your workspace admin.");
      }
    }

    await ctx.db.patch(userId, {
      notifications: {
        ...user.notifications,
        ...args.notifications,
      },
    });
  },
});
