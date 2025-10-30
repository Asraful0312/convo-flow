import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get conversation for a response
export const getConversation = query({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first()
  },
})

// Create or update conversation
export const saveConversation = mutation({
  args: {
    responseId: v.id("responses"),
    messages: v.array(v.any()),
    aiContext: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        messages: args.messages,
        aiContext: args.aiContext,
      })
      return existing._id
    } else {
      return await ctx.db.insert("conversations", {
        responseId: args.responseId,
        messages: args.messages,
        aiContext: args.aiContext,
      })
    }
  },
})

// Add message to conversation
export const addMessage = mutation({
  args: {
    responseId: v.id("responses"),
    message: v.object({
      id: v.string(),
      role: v.union(v.literal("assistant"), v.literal("user")),
      content: v.string(),
      timestamp: v.number(),
      questionId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first()

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        messages: [...conversation.messages, args.message],
      })
    } else {
      await ctx.db.insert("conversations", {
        responseId: args.responseId,
        messages: [args.message],
      })
    }
  },
})
