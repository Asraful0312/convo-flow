import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const storeTokens = internalMutation({
    args: { 
        userId: v.id("users"), 
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresIn: v.number(),
    },
    handler: async (ctx, { userId, accessToken, refreshToken, expiresIn }) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), "hubspot"))
            .first();

        const config = { 
            accessToken,
            refreshToken,
            expiresAt: Date.now() + (expiresIn * 1000),
        };

        if (existing) {
            await ctx.db.patch(existing._id, { config, enabled: true });
        } else {
            await ctx.db.insert("integrations", {
                userId,
                type: "hubspot",
                name: "HubSpot",
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});
