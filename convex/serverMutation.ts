import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import { assertAdmin } from "./auth_helpers";

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
    memberId: v.union(v.id("workspaceMembers"), v.id("invites")),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, { memberId, role }) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new ConvexError("Not authenticated");
    }

    const inviteId = ctx.db.normalizeId("invites", memberId as string);
    if (inviteId) {
      const invite = await ctx.db.get(inviteId);
      if (!invite) throw new ConvexError("Invite not found.");
      await assertAdmin(ctx, invite.workspaceId);
      await ctx.db.patch(inviteId, { role });
      await ctx.runMutation(api.activities.logActivity, {
        workspaceId: invite.workspaceId,
        userId: adminUserId,
        action: "invite.updateRole",
        details: { updatedEmail: invite.email, newRole: role },
      });
      return;
    }

    const wsMemberId = ctx.db.normalizeId(
      "workspaceMembers",
      memberId as string,
    );
    if (wsMemberId) {
      const member = await ctx.db.get(wsMemberId);
      if (!member) throw new ConvexError("Member not found.");
      await assertAdmin(ctx, member.workspaceId);
      await ctx.db.patch(wsMemberId, { role });
      await ctx.runMutation(api.activities.logActivity, {
        workspaceId: member.workspaceId,
        userId: adminUserId,
        action: "member.updateRole",
        details: { updatedUserId: member.userId, newRole: role },
      });
      return;
    }

    throw new ConvexError("Invalid member or invite ID.");
  },
});

export const removeMember = mutation({
  args: {
    memberId: v.union(v.id("workspaceMembers"), v.id("invites")),
    status: v.string(),
  },
  handler: async (ctx, { memberId, status }) => {
    const adminUserId = await getAuthUserId(ctx);
    if (!adminUserId) {
      throw new ConvexError("Not authenticated");
    }

    if (status === "pending") {
      const inviteId = ctx.db.normalizeId("invites", memberId as string);
      if (!inviteId) throw new ConvexError("Invalid invite ID.");
      const invite = await ctx.db.get(inviteId);
      if (!invite) throw new ConvexError("Invite not found.");

      await assertAdmin(ctx, invite.workspaceId);
      await ctx.db.delete(inviteId);

      await ctx.runMutation(api.activities.logActivity, {
        workspaceId: invite.workspaceId,
        userId: adminUserId,
        action: "invite.remove",
        details: { removedEmail: invite.email },
      });
      return;
    }

    const wsMemberId = ctx.db.normalizeId(
      "workspaceMembers",
      memberId as string,
    );
    if (!wsMemberId) throw new ConvexError("Invalid member ID.");
    const member = await ctx.db.get(wsMemberId);
    if (!member) {
      throw new ConvexError("Member not found.");
    }

    await assertAdmin(ctx, member.workspaceId);

    const workspace = await ctx.db.get(member.workspaceId);
    if (workspace?.ownerId === member.userId) {
      throw new ConvexError("Cannot remove the workspace owner.");
    }

    await ctx.db.delete(wsMemberId);

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

    await ctx.runMutation(api.activities.logActivity, {
      workspaceId: member.workspaceId,
      userId: adminUserId,
      action: "member.remove",
      details: { removedUserId: member.userId },
    });
  },
});
