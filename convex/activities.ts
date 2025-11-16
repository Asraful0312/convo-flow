import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertEditor } from "./auth_helpers";
import { Id } from "./_generated/dataModel";

export const listForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await assertEditor(ctx, workspaceId);
    return await ctx.db
      .query("activities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(20);
  },
});

export const logActivity = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    action: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activities", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      action: args.action,
      details: args.details,
      createdAt: 0,
    });
  },
});

export const deleteActivity = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, { activityId }) => {
    const activity = await ctx.db.get(activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    // Check user's permission for the workspace
    await assertEditor(ctx, activity.workspaceId);

    await ctx.db.delete(activityId);
  },
});
