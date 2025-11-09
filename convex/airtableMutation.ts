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
            .withIndex("by_user_and_service", q => q.eq("userId", userId).eq("service", "airtable"))
            .first();
        
        if (existing) {
            await ctx.db.patch(existing._id, {
                codeVerifier,
                expiresAt: Date.now() + TEN_MINUTES,
            });
        } else {
            await ctx.db.insert("oauth_temp_storage", {
                userId,
                service: "airtable",
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
            .withIndex("by_user_and_service", q => q.eq("userId", userId).eq("service", "airtable"))
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
        expiresIn: v.number(),
    },
    handler: async (ctx, { userId, accessToken, refreshToken, expiresIn }) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), "airtable"))
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
                type: "airtable",
                name: "Airtable",
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});
