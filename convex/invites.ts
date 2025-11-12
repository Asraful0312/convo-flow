import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

export const get = query({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, { inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) return null;

    const workspace = await ctx.db.get(invite.workspaceId);

    return {
      ...invite,
      workspaceName: workspace?.name ?? "A workspace",
    };
  },
});

export const listForUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    return await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const accept = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, { inviteId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated.");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found.");
    }

    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.status !== "pending") {
      throw new ConvexError("Invite not found or already accepted.");
    }

    if (invite.email !== user.email) {
      throw new ConvexError("This invite is for a different email address.");
    }

    await ctx.db.insert("workspaceMembers", {
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
    });

    await ctx.db.delete(invite._id);

    await ctx.runMutation(internal.activities.logActivity, {
      workspaceId: invite.workspaceId,
      userId,
      action: "member.join",
      details: { role: invite.role },
    });

    return { workspaceId: invite.workspaceId };
  },
});

export const getByEmail = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  handler: async (ctx, { workspaceId, email }) => {
    return await ctx.db
      .query("invites")
      .withIndex("by_workspace_and_email", (q) =>
        q.eq("workspaceId", workspaceId).eq("email", email),
      )
      .first();
  },
});
