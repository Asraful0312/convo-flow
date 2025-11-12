import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const addInvite = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("invites", {
      ...args,
      status: "pending",
    });
  },
});
