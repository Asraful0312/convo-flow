import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Create or update an answer
export const saveAnswer = mutation({
  args: {
    responseId: v.id("responses"),
    questionId: v.id("questions"),
    value: v.any(),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if answer already exists
    const existingAnswer = await ctx.db
      .query("answers")
      .withIndex("by_response_and_question", (q) =>
        q.eq("responseId", args.responseId).eq("questionId", args.questionId),
      )
      .first()

    if (existingAnswer) {
      // Update existing answer
      await ctx.db.patch(existingAnswer._id, {
        value: args.value,
        fileUrl: args.fileUrl,
        fileName: args.fileName,
        fileSize: args.fileSize,
      })
      return existingAnswer._id
    } else {
      // Create new answer
      return await ctx.db.insert("answers", {
        responseId: args.responseId,
        questionId: args.questionId,
        value: args.value,
        fileUrl: args.fileUrl,
        fileName: args.fileName,
        fileSize: args.fileSize,
        createdAt: Date.now(),
      })
    }
  },
})

// Get answers for a response
export const getResponseAnswers = query({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("answers")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .collect()
  },
})
