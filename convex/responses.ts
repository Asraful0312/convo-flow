import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { assertEditor } from "./auth_helpers";

// Get all responses for a form
export const getFormResponses = query({
  args: {
    formId: v.id("forms"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId));

    const responses = await query.order("desc").collect();

    if (args.status) {
      return responses.filter((r) => r.status === args.status);
    }

    return responses;
  },
});

// Get a single response with answers
export const getResponseWithAnswers = query({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) return null;

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .collect();

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first();

    return { ...response, answers, conversation };
  },
});

export const getResponseDetailPageData = query({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) return null;

    const form = await ctx.db.get(response.formId);
    if (!form) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", form._id))
      .order("asc")
      .collect();

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .collect();

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first();

    return {
      response,
      form,
      questions,
      answers,
      conversation,
    };
  },
});

// Create a new response
export const createResponse = mutation({
  args: {
    formId: v.id("forms"),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("responses", {
      formId: args.formId,
      status: "in_progress",
      startedAt: now,
      metadata: args.metadata || {},
    });
  },
});

// Update response
export const updateResponse = mutation({
  args: {
    responseId: v.id("responses"),
    status: v.optional(
      v.union(
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("abandoned"),
      ),
    ),
    contactInfo: v.optional(v.any()),
    qualityScore: v.optional(v.number()),
    sentiment: v.optional(v.string()),
    summary: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    actionableInsights: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { responseId, ...updates } = args;

    if (updates.status === "completed") {
      await ctx.db.patch(responseId, {
        ...updates,
        completedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.ai.generateInsights, {
        responseId,
      });
      await ctx.scheduler.runAfter(
        0,
        internal.integrationActions.sendToIntegrations,
        { responseId },
      );
      await ctx.scheduler.runAfter(0, internal.webhooks.trigger, {
        responseId,
        event: "response.completed",
      });
    } else {
      await ctx.db.patch(responseId, updates);
    }
  },
});

// Delete response
export const deleteResponse = mutation({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) {
      throw new ConvexError("Response not found");
    }

    const form = await ctx.db.get(response.formId);
    if (!form) {
      throw new ConvexError("Form not found for this response");
    }

    if (!form.workspaceId) {
      throw new ConvexError("Workspace not found");
    }

    await assertEditor(ctx, form.workspaceId);

    // Delete all answers
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .collect();

    for (const answer of answers) {
      await ctx.db.delete(answer._id);
    }

    // Delete conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", args.responseId))
      .first();

    if (conversation) {
      await ctx.db.delete(conversation._id);
    }

    // Delete the response
    await ctx.db.delete(args.responseId);
  },
});

export const deleteManyResponses = mutation({
  args: { responseIds: v.array(v.id("responses")) },
  handler: async (ctx, args) => {
    for (const responseId of args.responseIds) {
      await ctx.runMutation(api.responses.deleteResponse, { responseId });
    }
  },
});

export const tagResponses = mutation({
  args: { responseIds: v.array(v.id("responses")), tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    for (const responseId of args.responseIds) {
      const existing = await ctx.db.get(responseId);
      const existingTags = existing?.tags || [];
      const newTags = [...new Set([...existingTags, ...args.tags])];
      await ctx.db.patch(responseId, { tags: newTags });
    }
  },
});

export const addNoteToResponse = mutation({
  args: { responseId: v.id("responses"), note: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.responseId, { notes: args.note });
  },
});

// Get response analytics for a form
export const getFormAnalytics = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();

    const total = responses.length;
    const completed = responses.filter((r) => r.status === "completed").length;
    const inProgress = responses.filter(
      (r) => r.status === "in_progress",
    ).length;
    const abandoned = responses.filter((r) => r.status === "abandoned").length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Calculate average completion time
    const completedResponses = responses.filter((r) => r.completedAt);
    const avgCompletionTime =
      completedResponses.length > 0
        ? completedResponses.reduce(
            (sum, r) => sum + (r.completedAt! - r.startedAt),
            0,
          ) / completedResponses.length
        : 0;

    return {
      total,
      completed,
      inProgress,
      abandoned,
      completionRate,
      avgCompletionTime,
    };
  },
});
