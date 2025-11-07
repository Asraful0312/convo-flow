import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

export const getIntegrations = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }
        return await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

export const addIntegration = mutation({
    args: {
        type: v.union(
            v.literal("zapier"),
            v.literal("slack"),
            v.literal("google_sheets"),
            v.literal("airtable"),
            v.literal("notion"),
            v.literal("hubspot"),
            v.literal("salesforce"),
        ),
        name: v.string(),
        config: v.any(),
    },
    handler: async (ctx, { type, name, config }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new ConvexError("Not authenticated");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new ConvexError("User not found");
        }

        if (user.subscriptionTier === "free") {
            throw new ConvexError("Integrations are only available for Pro and Business plans.");
        }

        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), type))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { config, enabled: true });
            return existing._id;
        } else {
            return await ctx.db.insert("integrations", {
                userId,
                type,
                name,
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});

export const updateIntegrationConfig = mutation({
    args: {
        integrationId: v.id("integrations"),
        config: v.any(),
    },
    handler: async (ctx, { integrationId, config }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("Not authenticated");

        const integration = await ctx.db.get(integrationId);
        if (!integration || integration.userId !== userId) {
            throw new ConvexError("Integration not found or you do not have permission to update it.");
        }

        const newConfig = { ...integration.config, ...config };
        await ctx.db.patch(integrationId, { config: newConfig });
    },
});

export const deleteIntegration = mutation({
    args: { integrationId: v.id("integrations") },
    handler: async (ctx, { integrationId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new ConvexError("Not authenticated");
        }

        const integration = await ctx.db.get(integrationId);
        if (!integration || integration.userId !== userId) {
            throw new ConvexError("Integration not found or you do not have permission to delete it.");
        }

        await ctx.db.delete(integrationId);
    },
});

export const getIntegrationsForUser = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});
