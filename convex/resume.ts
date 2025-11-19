import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const messagePayload = v.object({
  id: v.string(),
  role: v.union(v.literal("assistant"), v.literal("user")),
  content: v.string(),
  timestamp: v.number(),
  questionId: v.optional(v.string()),
  isAdaptive: v.optional(v.boolean()),
  value: v.optional(v.any()),
});

export const saveProgressAndSendLink = mutation({
  args: {
    responseId: v.id("responses"),
    email: v.string(),
    baseUrl: v.string(),
    messages: v.array(messagePayload),
  },
  handler: async (ctx, { responseId, email, baseUrl, messages }) => {
    const response = await ctx.db.get(responseId);
    if (!response) {
      throw new Error("Response not found");
    }

    const form = await ctx.db.get(response.formId);
    if (!form) {
      throw new Error("Form not found");
    }

    // Update the response with the user's email
    await ctx.db.patch(responseId, {
      contactInfo: {
        ...(response.contactInfo ?? {}),
        email,
      },
    });

    // Save the conversation progress
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", responseId))
      .first();

    if (existingConversation) {
      await ctx.db.patch(existingConversation._id, { messages });
    } else {
      await ctx.db.insert("conversations", { responseId, messages });
    }

    // Construct the resume URL
    const resumeUrl = `${baseUrl}/f/${form._id}?resume=${responseId}`;

    // Schedule the email to be sent
    await ctx.scheduler.runAfter(0, internal.emails.sendResumeLink, {
      email,
      formTitle: form.title,
      resumeUrl,
    });

    return { success: true };
  },
});

export const getResumeData = query({
  args: {
    responseId: v.id("responses"),
  },
  handler: async (ctx, { responseId }) => {
    const response = await ctx.db.get(responseId);
    if (!response) {
      return null;
    }

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_response", (q) => q.eq("responseId", responseId))
      .collect();

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_response", (q) => q.eq("responseId", responseId))
      .first();

    return {
      answers,
      conversation,
    };
  },
});
