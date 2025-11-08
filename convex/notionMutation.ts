import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const storeAccessToken = internalMutation({
    args: { 
        userId: v.id("users"), 
        accessToken: v.string(),
        workspaceId: v.string(),
        workspaceName: v.string(),
        workspaceIcon: v.union(v.string(), v.null()),
        botId: v.string(),
    },
    handler: async (ctx, { userId, accessToken, workspaceId, workspaceName, workspaceIcon, botId }) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("type"), "notion"))
            .first();

        const config = { 
            accessToken,
            workspaceId,
            workspaceName,
            workspaceIcon,
            botId,
        };

        if (existing) {
            await ctx.db.patch(existing._id, { config, enabled: true });
        } else {
            await ctx.db.insert("integrations", {
                userId,
                type: "notion",
                name: "Notion",
                config,
                enabled: true,
                createdAt: Date.now(),
            });
        }
    },
});
