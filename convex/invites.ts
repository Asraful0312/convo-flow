import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getByEmail = internalQuery({
    args: {
        workspaceId: v.id("workspaces"),
        email: v.string(),
    },
    handler: async (ctx, { workspaceId, email }) => {
        return await ctx.db
            .query("invites")
            .withIndex("by_workspace_and_email", (q) =>
                q.eq("workspaceId", workspaceId).eq("email", email)
            )
            .first();
    },
});
