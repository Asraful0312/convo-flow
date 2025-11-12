import { ConvexError, v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { assertAdmin } from "./auth_helpers";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addInvite = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const inviteId = await ctx.db.insert("invites", {
      ...args,
      status: "pending",
    });
    return inviteId;
  },
});

export const updateRole = mutation({
  args: {
    memberId: v.id("workspaceMembers"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, { memberId, role }) => {
    const member = await ctx.db.get(memberId);
    if (!member) {
      throw new ConvexError("Member not found.");
    }

    await assertAdmin(ctx, member.workspaceId);

    await ctx.db.patch(memberId, { role });

    const admin = await getAuthUserId(ctx);
    if (!admin) {
      throw new ConvexError("Not authenticated");
    }

    await ctx.runMutation(internal.activities.logActivity, {
      workspaceId: member.workspaceId,
      userId: admin,
      action: "member.updateRole",
      details: { updatedUserId: member.userId, newRole: role },
    });
  },
});

export const removeMember = mutation({
  args: {
    memberId: v.id("workspaceMembers"),
  },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) {
      throw new ConvexError("Member not found.");
    }

    await assertAdmin(ctx, member.workspaceId);

    const workspace = await ctx.db.get(member.workspaceId);
    if (workspace?.ownerId === member.userId) {
      throw new ConvexError("Cannot remove the workspace owner.");
    }

    await ctx.db.delete(memberId);

    // Check if the removed workspace was the user's active one
    const removedUser = await ctx.db.get(member.userId);
    if (removedUser && removedUser.activeWorkspaceId === member.workspaceId) {
      // Find another workspace for this user
      const otherWorkspaces = await ctx.db
        .query("workspaceMembers")
        .withIndex("by_user", (q) => q.eq("userId", member.userId))
        .collect();

      // Set the new active workspace to the first one found, or null
      const newActiveWorkspaceId =
        otherWorkspaces.length > 0 ? otherWorkspaces[0].workspaceId : undefined;

      await ctx.db.patch(member.userId, {
        activeWorkspaceId: newActiveWorkspaceId,
      });
    }

    const admin = await getAuthUserId(ctx);
    if (!admin) {
      throw new ConvexError("Not authenticated");
    }

    await ctx.runMutation(internal.activities.logActivity, {
      workspaceId: member.workspaceId,
      userId: admin,
      action: "member.remove",
      details: { removedUserId: member.userId },
    });
  },
});
