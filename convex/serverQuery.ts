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

    // 1. Fetch data in parallel for better performance
    const [inviteMembers, members] = await Promise.all([
      ctx.db
        .query("invites")
        .withIndex("by_workspace_and_email", (q) =>
          q.eq("workspaceId", workspaceId),
        )
        .collect(),
      ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
        .collect(),
    ]);

    // 2. Fetch User profiles for active members
    const users = await Promise.all(
      members.map((member) => ctx.db.get(member.userId)),
    );

    type UnifiedMember = {
      _id: string;
      role: "admin" | "editor" | "viewer";
      status: "active" | "pending";
      name: string;
      email: string;
      image?: string;
      userId?: string; // Optional because invites don't have this yet
    };

    // 3. Map Active Members to Unified Format
    const activeMembers: UnifiedMember[] = members.map((member) => {
      const user = users.find((u) => u?._id === member.userId);
      return {
        _id: member._id,
        userId: member.userId,
        role: member.role as any,
        status: "active",
        name: user?.name ?? "Unknown",
        email: user?.email ?? "No email",
        image: user?.image,
      };
    });

    // 4. Map Invites to Unified Format
    const pendingInvites: UnifiedMember[] = inviteMembers.map((invite) => ({
      _id: invite._id,
      role: invite.role as any,
      status: "pending",
      name: invite.email.split("@")[0], // Fallback name from email
      email: invite.email,
      image: undefined, // Invites usually don't have images yet
    }));

    // 5. Merge and return
    console.log("marge and return", [...activeMembers, ...pendingInvites]);
    return [...activeMembers, ...pendingInvites];
  },
});
