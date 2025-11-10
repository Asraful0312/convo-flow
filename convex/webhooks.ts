import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("webhooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    url: v.string(),
    events: v.array(v.string()),
    name: v.string(),
  },
  handler: async (ctx, { url, events, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:") {
        throw new ConvexError("Webhook URL must use https.");
      }
    } catch (e) {
      throw new ConvexError("Invalid URL format.");
    }

    return await ctx.db.insert("webhooks", {
      userId,
      url,
      events: events as any,
      name,
      enabled: true,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, { webhookId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const webhook = await ctx.db.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      throw new ConvexError(
        "Webhook not found or you do not have permission to delete it."
      );
    }

    await ctx.db.delete(webhookId);
  },
});

export const trigger = internalAction({
  args: {
    responseId: v.id("responses"),
    event: v.union(
      v.literal("response.created"),
      v.literal("response.updated"),
      v.literal("response.completed")
    ),
  },
  handler: async (ctx, { responseId, event }) => {
    const response = await ctx.runQuery(api.responses.getResponseWithAnswers, {
      responseId,
    });
    if (!response) return;

    const form = await ctx.runQuery(internal.forms.getFormForIntegrations, {
      formId: response.formId,
    });
    if (!form) return;

    const userWebhooks = await ctx.runQuery(
      internal.webhooks.getForUserByEvent,
      { userId: form.userId, event }
    );

    if (!userWebhooks || userWebhooks.length === 0) {
      return;
    }

    const answersWithQuestions = response.answers.map((answer) => {
      const question = form.questions.find((q: any) => q._id === answer.questionId);
      return {
        ...answer,
        questionText: question?.text || "Unknown Question",
      };
    });

    const payload = {
      event,
      form: {
        id: form._id,
        title: form.title,
      },
      response: {
        id: response._id,
        status: response.status,
        submittedAt: response.completedAt,
        answers: answersWithQuestions.reduce((acc, ans) => {
          acc[ans.questionText] = ans.value;
          return acc;
        }, {} as Record<string, any>),
      },
      timestamp: Date.now(),
    };

    await Promise.all(
      userWebhooks.map((webhook) =>
        ctx.scheduler.runAfter(0, internal.webhooks.send, {
          webhookId: webhook._id,
          payload,
        })
      )
    );
  },
});

export const send = internalAction({
  args: {
    webhookId: v.id("webhooks"),
    payload: v.any(),
  },
  handler: async (ctx, { webhookId, payload }) => {
    const webhook = await ctx.runQuery(internal.webhooks.getById, {
      webhookId,
    });
    if (!webhook || !webhook.enabled) {
      return;
    }

    try {
      const result = await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await ctx.runMutation(internal.webhooks.updateLastTriggered, {
        webhookId,
        status: result.status,
      });

      if (!result.ok) {
        console.error(
          `Webhook failed for ${webhook.url} with status ${result.status}`
        );
      }
    } catch (error) {
      console.error(`Error sending webhook to ${webhook.url}`, error);
      await ctx.runMutation(internal.webhooks.updateLastTriggered, {
        webhookId,
        status: 500,
      });
    }
  },
});

export const getForUserByEvent = internalQuery({
  args: {
    userId: v.id("users"),
    event: v.string(),
  },
  handler: async (ctx, { userId, event }) => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();

    return webhooks.filter((wh) => wh.events.includes(event as any));
  },
});

export const getById = internalQuery({
  args: { webhookId: v.id("webhooks") },
  handler: async (ctx, { webhookId }) => {
    return await ctx.db.get(webhookId);
  },
});

export const updateLastTriggered = internalMutation({
  args: { webhookId: v.id("webhooks"), status: v.number() },
  handler: async (ctx, { webhookId, status }) => {
    await ctx.db.patch(webhookId, { lastTriggeredAt: Date.now() });
  },
});
