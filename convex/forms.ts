import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get all forms for a user
export const getUserForms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
  },
})

// Get a single form by ID
export const getForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.formId)
  },
})

// Get form with questions
export const getFormWithQuestions = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId)
    if (!form) return null

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .order("asc")
      .collect()

    return { ...form, questions }
  },
})

// Create a new form
export const createForm = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("forms", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      status: "draft",
      settings: {
        notifications: {
          emailOnResponse: true,
        },
        showProgressBar: true,
        allowMultipleResponses: false,
      },
      aiConfig: {
        personality: "friendly",
        language: "en",
        enableVoice: true,
        enableFollowUps: true,
      },
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update form
export const updateForm = mutation({
  args: {
    formId: v.id("forms"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("closed"))),
    settings: v.optional(v.any()),
    aiConfig: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { formId, ...updates } = args
    await ctx.db.patch(formId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

// Publish form
export const publishForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.patch(args.formId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    })
  },
})

// Delete form
export const deleteForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    // Delete all questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect()

    for (const question of questions) {
      await ctx.db.delete(question._id)
    }

    // Delete the form
    await ctx.db.delete(args.formId)
  },
})
