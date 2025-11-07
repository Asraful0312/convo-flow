import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const storeRefreshToken = internalMutation({
    args: { userId: v.id("users"), refreshToken: v.string() },
    handler: async (ctx, { userId, refreshToken }) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), "google_sheets"))
            .first();

        const config = { refreshToken };

        if (existing) {
            await ctx.db.patch(existing._id, { config, enabled: true });
        } else {
            await ctx.db.insert("integrations", {
                userId,
                type: "google_sheets",
                name: "Google Sheets",
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});