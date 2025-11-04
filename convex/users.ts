import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first()
  },
})

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
})

export const getUserByStripeCustomerId = internalQuery({
    args: { stripeCustomerId: v.string() },
    handler: async (ctx, { stripeCustomerId }) => {
        return await ctx.db
            .query("users")
            .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", stripeCustomerId))
            .unique();
    },
});


export const updateUserSubscription = internalMutation({
    args: {
        userId: v.id("users"),
        stripeSubscriptionId: v.optional(v.string()),
        stripePriceId: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
        subscriptionTier: v.union(v.literal("free"), v.literal("pro"), v.literal("business"), v.literal("enterprise")),
        subscriptionStatus: v.union(v.literal("active"), v.literal("canceled"), v.literal("past_due"), v.literal("trialing"), v.literal("incomplete"), v.literal("incomplete_expired"), v.literal("unpaid")),
    },
    handler: async (ctx, args) => {
        const { userId, ...rest } = args;
        await ctx.db.patch(userId, {stripeCustomerId: rest.stripeCustomerId, stripePriceId: rest.stripePriceId, stripeSubscriptionId: rest.stripeSubscriptionId, subscriptionStatus: rest.subscriptionStatus, subscriptionTier: rest.subscriptionTier});
    },
});


// Update user subscription
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionTier: v.union(v.literal("free"), v.literal("pro"), v.literal("business"), v.literal("enterprise")),
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
    })
  },
})
