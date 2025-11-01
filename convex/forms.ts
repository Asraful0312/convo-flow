import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

export const getFormsForUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const forms = await ctx.db
      .query("forms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()

    const formsWithResponseCount = await Promise.all(
      forms.map(async (form) => {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_form", (q) => q.eq("formId", form._id))
          .collect()
        return {
          ...form,
          responseCount: responses.length,
        }
      })
    )

    return formsWithResponseCount
  },
})

export const getSingleForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
     const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const form = await ctx.db.get(args.formId)
    
    if (form?.userId !== userId) {
      throw new Error("You can't access this")
    }

    return {
      ...form,
      questions:await ctx.db
          .query("questions")
          .withIndex("by_form", (q) => q.eq("formId", form._id))
          .collect()
    }
  }
},
)

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.string(),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
      })
    ),
    settings: v.optional(
      v.object({
        branding: v.optional(
          v.object({
            primaryColor: v.optional(v.string()),
            logoUrl: v.optional(v.string()),
          })
        ),
        notifications: v.optional(
          v.object({
            emailOnResponse: v.optional(v.boolean()),
            notificationEmail: v.optional(v.string()),
          })
        ),
      })
    ),
    aiConfig: v.optional(
      v.object({
        personality: v.optional(v.union(v.literal("professional"), v.literal("friendly"), v.literal("casual"), v.literal("formal"))),
        enableVoice: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Unauthenticated")

    const formId = await ctx.db.insert("forms", {
      userId,
      title: args.title,
      description: args.description,
      status: "draft",
      settings: args.settings ?? {},
      aiConfig: args.aiConfig ?? {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i]
      await ctx.db.insert("questions", {
        formId,
        order: i,
        text: q.text,
        type: q.type as any,
        required: q.required,
        options: q.options,
      })
    }

    return formId
  },
})

export const updateSettings = mutation({
  args: {
    formId: v.id("forms"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("closed"))),
    primaryColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    // notifications
    emailOnResponse: v.optional(v.boolean()),
    notificationEmail: v.optional(v.string()),
    personality: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("friendly"),
        v.literal("casual"),
        v.literal("formal")
      )
    ),
    voiceEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const form = await ctx.db.get(args.formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Not authorized");


    const patch: any = {
  updatedAt: Date.now(),
};

// title / description
if (args.title !== undefined) patch.title = args.title;
if (args.description !== undefined) patch.description = args.description;
if (args.status !== undefined) patch.status = args.status;

// Nested updates (correct way)
const updatedSettings = { ...form.settings };

// Update branding
if (args.primaryColor !== undefined || args.logoUrl !== undefined) {
  updatedSettings.branding = {
    ...(form.settings?.branding ?? {}),
    ...(args.primaryColor && { primaryColor: args.primaryColor }),
    ...(args.logoUrl && { logoUrl: args.logoUrl }),
  };
}

// Update notifications
if (args.emailOnResponse !== undefined || args.notificationEmail !== undefined) {
  updatedSettings.notifications = {
    ...(form.settings?.notifications ?? {}),
    ...(args.emailOnResponse !== undefined && { emailOnResponse: args.emailOnResponse }),
    ...(args.notificationEmail && { notificationEmail: args.notificationEmail }),
  };
}

if (Object.keys(updatedSettings).length > 0) {
  patch.settings = updatedSettings;
}

// AI Config
if (args.personality !== undefined || args.voiceEnabled !== undefined) {
  patch.aiConfig = {
    ...(form.aiConfig ?? {}),
    ...(args.personality && { personality: args.personality }),
    ...(args.voiceEnabled !== undefined && { enableVoice: args.voiceEnabled }),
  };
}

await ctx.db.patch(args.formId, patch);
return args.formId;

  },
});

export const deleteForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const form = await ctx.db.get(args.formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Not authorized to delete this form");

    // 1. Delete all responses
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();

    await Promise.all(responses.map((r) => ctx.db.delete(r._id)));

    // 2. Delete all questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();

    await Promise.all(questions.map((q) => ctx.db.delete(q._id)));

    // 3. Delete the form
    await ctx.db.delete(args.formId);

    return { deletedFormId: args.formId };
  },
});