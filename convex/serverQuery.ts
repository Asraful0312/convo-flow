import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { assertViewer } from "./auth_helpers";

export const getMember = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, { workspaceId, userId }) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId),
      )
      .first();
  },
});

export const isMember = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, { workspaceId, userId }) => {
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId),
      )
      .first();
    return !!member;
  },
});

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    await assertViewer(ctx, workspaceId);

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const users = await Promise.all(
      members.map((member) => ctx.db.get(member.userId)),
    );

    return members.map((member) => {
      const user = users.find((u) => u?._id === member.userId);
      return {
        ...member,
        name: user?.name ?? "Unknown",
        email: user?.email ?? "No email",
        image: user?.image,
      };
    });
  },
});
