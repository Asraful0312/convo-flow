import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Create the workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name,
      ownerId: userId,
      createdAt: Date.now(),
    });

    // Make the creator an admin of the new workspace
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "admin",
    });

    // Set it as the user's active workspace
    await ctx.db.patch(userId, { activeWorkspaceId: workspaceId });

    return workspaceId;
  },
});

export const get = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      throw new ConvexError("Workspace not found");
    }
    return workspace;
  },
});

export const listForUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberRecords = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workspaceIds = memberRecords.map((m) => m.workspaceId);

    const workspaces = await Promise.all(
      workspaceIds.map((id) => ctx.db.get(id)),
    );

    return workspaces.filter(Boolean);
  },
});

export const switchActive = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user is a member of the workspace they are switching to
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId),
      )
      .first();

    if (!member) {
      throw new ConvexError("You are not a member of this workspace.");
    }

    await ctx.db.patch(userId, { activeWorkspaceId: workspaceId });
  },
});
