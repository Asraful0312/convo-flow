import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { assertViewer } from "./auth_helpers";

export const listForWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    await assertViewer(ctx, workspaceId);

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(20); // Get latest 20 activities

    const users = await Promise.all(
      activities.map((a) => ctx.db.get(a.userId)),
    );

    return activities.map((activity) => {
      const user = users.find((u) => u?._id === activity.userId);
      return {
        ...activity,
        userName: user?.name ?? "A user",
      };
    });
  },
});

export const logActivity = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    action: v.string(),
    details: v.any(),
  },
  handler: async (ctx, { workspaceId, userId, action, details }) => {
    await ctx.db.insert("activities", {
      workspaceId,
      userId,
      action,
      details,
      createdAt: Date.now(),
    });
  },
});
