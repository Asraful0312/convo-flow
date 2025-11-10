import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const TEN_MINUTES = 10 * 60 * 1000;

export const storeCodeVerifier = internalMutation({
    args: {
        userId: v.id("users"),
        codeVerifier: v.string(),
    },
    handler: async (ctx, { userId, codeVerifier }) => {
        const existing = await ctx.db
            .query("oauth_temp_storage")
            .withIndex("by_user_and_service", q => q.eq("userId", userId).eq("service", "salesforce"))
            .first();
        
        if (existing) {
            await ctx.db.patch(existing._id, {
                codeVerifier,
                expiresAt: Date.now() + TEN_MINUTES,
            });
        } else {
            await ctx.db.insert("oauth_temp_storage", {
                userId,
                service: "salesforce",
                codeVerifier,
                expiresAt: Date.now() + TEN_MINUTES,
            });
        }
    },
});

export const getCodeVerifier = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const record = await ctx.db
            .query("oauth_temp_storage")
            .withIndex("by_user_and_service", q => q.eq("userId", userId).eq("service", "salesforce"))
            .first();
        
        if (record && record.expiresAt < Date.now()) {
            return null; // Verifier expired
        }
        return record;
    },
});

export const deleteCodeVerifier = internalMutation({
    args: { verifierId: v.id("oauth_temp_storage") },
    handler: async (ctx, { verifierId }) => {
        await ctx.db.delete(verifierId);
    },
});


export const storeTokens = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    instanceUrl: v.string(),
  },
  handler: async (
    ctx,
    { userId, accessToken, refreshToken, instanceUrl }
  ) => {
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("type"), "salesforce"))
      .first();

    const config = {
      accessToken,
      refreshToken,
      instanceUrl,
    };

    if (existing) {
      await ctx.db.patch(existing._id, { config, enabled: true });
    } else {
      await ctx.db.insert("integrations", {
        userId,
        type: "salesforce",
        name: "Salesforce",
        config,
        enabled: true,
        createdAt: Date.now(),
      });
    }
  },
});