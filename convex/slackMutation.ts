import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const storeIncomingWebhook = internalMutation({
    args: { 
        userId: v.id("users"), 
        url: v.string(),
        channel: v.string(),
        channelId: v.string(),
        configurationUrl: v.string(),
    },
    handler: async (ctx, { userId, url, channel, channelId, configurationUrl }) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), "slack"))
            .first();

        const config = { 
            incomingWebhook: {
                url,
                channel,
                channelId,
                configurationUrl,
            }
        };

        if (existing) {
            await ctx.db.patch(existing._id, { config, enabled: true });
        } else {
            await ctx.db.insert("integrations", {
                userId,
                type: "slack",
                name: "Slack",
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});
