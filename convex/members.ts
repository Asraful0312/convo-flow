"use node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, query } from "./_generated/server";
import { assertViewer } from "./auth_helpers";
import { ConvexError } from "convex/values";

export const invite = action({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, { workspaceId, email, role }) => {
    const inviter = await ctx.runQuery(internal.users.getMe);
    if (!inviter) {
        throw new ConvexError("Not authenticated.");
    }
    const inviterId = inviter._id;

    const member = await ctx.runQuery(internal.serverQuery.getMember, {
      workspaceId,
      userId: inviterId,
    });
    if (!member || member.role !== "admin") {
      throw new ConvexError("You must be an admin to invite members.");
    }

    const invitedUser = await ctx.runQuery(internal.users.getByEmail, {
      email,
    });

    if (invitedUser) {
      const isAlreadyMember = await ctx.runQuery(
        internal.serverQuery.isMember,
        {
          workspaceId,
          userId: invitedUser._id,
        },
      );
      if (isAlreadyMember) {
        throw new ConvexError(
          "This user is already a member of the workspace.",
        );
      }
    }

    const existingInvite = await ctx.runQuery(internal.invites.getByEmail, {
      workspaceId,
      email,
    });
    if (existingInvite) {
      throw new ConvexError("An invite for this email already exists.");
    }

    const inviteId = await ctx.runMutation(internal.serverMutation.addInvite, {
      workspaceId,
      email,
      role,
      invitedBy: inviterId,
    });

    await ctx.runMutation(internal.activities.logActivity, {
        workspaceId,
        userId: inviterId,
        action: "member.invite",
        details: { email, role },
    });

    const workspace = await ctx.runQuery(internal.workspaces.get, { workspaceId });
    const inviteUrl = `${process.env.SITE_URL}/invites/${inviteId}`;

    await ctx.runAction(internal.emails.sendInviteEmail, {
        email,
        workspaceName: workspace.name,
        inviterName: inviter.name ?? "A user",
        inviteUrl,
    });
  },
});
