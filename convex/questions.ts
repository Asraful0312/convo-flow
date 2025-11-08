import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get all questions for a form
export const getFormQuestions = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .order("asc")
      .collect()
  },
})

// Create a question
export const createQuestion = mutation({
  args: {
    formId: v.id("forms"),
    type: v.string(),
    text: v.string(),
    description: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    options: v.optional(v.any()),
    validation: v.optional(v.any()),
    required: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", {
      formId: args.formId,
      type: args.type as any,
      text: args.text,
      description: args.description,
      placeholder: args.placeholder,
      options: args.options,
      validation: args.validation,
      required: args.required,
      order: args.order,
    })
  },
})

// Update question
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    text: v.optional(v.string()),
    description: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    options: v.optional(v.any()),
    validation: v.optional(v.any()),
    required: v.optional(v.boolean()),
    order: v.optional(v.number()),
       type: v.union(
      v.literal("text"),
      v.literal("email"),
      v.literal("number"),
      v.literal("phone"),
      v.literal("url"),
      v.literal("textarea"),
      v.literal("choice"),
      v.literal("multiple_choice"),
      v.literal("dropdown"),
      v.literal("rating"),
      v.literal("scale"),
      v.literal("date"),
      v.literal("time"),
      v.literal("file"),
      v.literal("location"),
      v.literal("currency"),
      v.literal("date_range"),
      v.literal("yes_no"),
    ),
  },
  handler: async (ctx, args) => {
    const { questionId, ...updates } = args
    await ctx.db.patch(questionId, updates)
  },
})

// Delete question
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.questionId)
  },
})

// Reorder questions
export const reorderQuestions = mutation({
  args: {
    formId: v.id("forms"),
    questionIds: v.array(v.id("questions")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.questionIds.length; i++) {
      await ctx.db.patch(args.questionIds[i], { order: i })
    }
  },
})
