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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const inviterId = identity.subject as any;

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

    await ctx.runMutation(internal.serverMutation.addInvite, {
      workspaceId,
      email,
      role,
      invitedBy: inviterId,
    });

    // TODO: Send an actual email with a link to accept the invite
  },
});
