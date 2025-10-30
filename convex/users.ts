import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
  },
})

// Create a new user
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const now = Date.now()
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      createdAt: now,
      updatedAt: now,
    })
  },
})

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
