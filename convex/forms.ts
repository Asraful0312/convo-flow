import { ConvexError, v } from "convex/values"
import { internalQuery, mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { api } from "./_generated/api";

export const getFormsForUser = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.union(v.literal("published"), v.literal("draft"), v.literal("closed"))),
  },
  handler: async (ctx, { searchQuery, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let forms;

    if (searchQuery) {
      forms = await ctx.db
        .query("forms")
        .withSearchIndex("by_title", (q) => q.search("title", searchQuery))
        .filter(q => q.eq(q.field("userId"), userId))
        .collect();
    } else {
      forms = await ctx.db
        .query("forms")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    if (status) {
      forms = forms.filter(form => form.status === status);
    }

    const formsWithResponseCount = await Promise.all(
      forms.map(async (form) => {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_form", (q) => q.eq("formId", form._id))
          .collect();
        return {
          ...form,
          responseCount: responses.length,
        };
      })
    );

    return formsWithResponseCount;
  },
});

export const getResponsesPageData = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const form = await ctx.db.get(args.formId);

    if (!form || form.userId !== userId) {
      return null;
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", form._id))
      .order("asc")
      .collect();

    const responses = await ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", form._id))
      .order("desc")
      .collect();

    const responsesWithAnswers = await Promise.all(
      responses.map(async (response) => {
        const firstAnswer = await ctx.db
          .query("answers")
          .withIndex("by_response", (q) => q.eq("responseId", response._id))
          .first();
        return { ...response, firstAnswer: firstAnswer || null };
      })
    );

    const analytics = await ctx.runQuery(api.responses.getFormAnalytics, { formId: args.formId });

    return {
      form,
      questions,
      responses: responsesWithAnswers,
      analytics,
    };
  },
});

export const getSingleForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
     const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new ConvexError("User not authenticated")
    }

    const form = await ctx.db.get(args.formId)
    
    if (form?.userId !== userId) {
      throw new ConvexError("You can't access this")
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

export const getFormForIntegrations = internalQuery({
    args: { formId: v.id("forms") },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.formId);
        if (!form) {
            return null;
        }
        return {
            ...form,
            questions: await ctx.db
                .query("questions")
                .withIndex("by_form", (q) => q.eq("formId", form._id))
                .collect(),
        };
    },
});

export const getPublicFormData = query({
    args: { formId: v.id("forms") },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.formId);
        if (!form) return null;

        if (form.status !== 'published') {
            return { ...form, questions: [], isOverResponseLimit: false, ownerName: "" };
        }

        const formOwner = await ctx.db.get(form.userId);
        if (!formOwner) return null;

        const limits = {
            free: 100,
            pro: 1000,
            business: 10000,
            enterprise: Infinity,
        };
        const tier = formOwner.subscriptionTier || "free";
        const limit = limits[tier as keyof typeof limits];

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const ownerForms = await ctx.db
            .query("forms")
            .withIndex("by_user", q => q.eq("userId", form.userId))
            .collect();
        
        let monthlyResponses = 0;
        for (const f of ownerForms) {
            const responses = await ctx.db
                .query("responses")
                .withIndex("by_form", q => q.eq("formId", f._id))
                .filter(q => q.gt(q.field("startedAt"), startOfMonth.getTime()))
                .collect();
            monthlyResponses += responses.length;
        }

        const isOverLimit = monthlyResponses >= limit;

        if (isOverLimit) {
            return {
                title: form.title,
                isOverResponseLimit: true,
                ownerName: formOwner.name,
            }
        }

        return {
            ...form,
            isOverResponseLimit: false,
            ownerName: formOwner.name,
            questions: await ctx.db.query("questions").withIndex("by_form", q => q.eq("formId", form._id)).order("asc").collect(),
        };
    }
});

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
    if (!userId) throw new ConvexError("Unauthenticated")
    
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("User not found");
    
    const subscriptionTier = user.subscriptionTier || "free"

    if (subscriptionTier) {
       if (subscriptionTier === "free") {
  // Branding restriction
  const hasCustomBranding =
    (args.settings?.branding?.logoUrl) ||
    (args.settings?.branding?.primaryColor && args.settings?.branding?.primaryColor !== "#6366f1");

  if (hasCustomBranding) {
    throw new ConvexError("Custom branding is not available on the free plan.");
  }

  // Voice restriction
  if (args?.aiConfig?.enableVoice === true) {
    throw new ConvexError("Voice features are not available on the free plan.");
   }

      }

    }

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
    if (!userId) throw new ConvexError("Unauthenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("User not found");

    const form = await ctx.db.get(args.formId);
    if (!form) throw new ConvexError("Form not found");
    if (form.userId !== userId) throw new ConvexError("Not authorized");

    const subscriptionTier = user.subscriptionTier || "free"

    if (subscriptionTier) {
       if (subscriptionTier === "free") {
  // Branding restriction
  const hasCustomBranding =
    (args.logoUrl && args.logoUrl !== form.settings?.branding?.logoUrl) ||
    (args.primaryColor && args.primaryColor !== form.settings?.branding?.primaryColor);

  if (hasCustomBranding) {
    throw new ConvexError("Custom branding is not available on the free plan.");
  }

  // Voice restriction
  if (args.voiceEnabled === true) {
    throw new ConvexError("Voice features are not available on the free plan.");
  }

  // Publish limit restriction
  if (args.status === "published") {
    const userForms = await ctx.db
      .query("forms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const isAlreadyPublished = form.status === "published";
    if (!isAlreadyPublished && userForms.length >= 3) {
      throw new ConvexError(
        "You can only have 3 active (published) forms on the free plan."
      );
    }
  }
}

    }

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

export const duplicateForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const originalForm = await ctx.db.get(args.formId);
    if (!originalForm) throw new ConvexError("Form not found");
    if (originalForm.userId !== userId) throw new ConvexError("Not authorized");

    const originalQuestions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .order("asc")
      .collect();

    // Create the new form
    const newFormId = await ctx.db.insert("forms", {
      userId,
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      status: "draft", // Duplicated forms are always drafts
      settings: originalForm.settings,
      aiConfig: originalForm.aiConfig,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Copy questions to the new form
    for (const q of originalQuestions) {
      // Create a new question object, omitting the original _id and _creationTime
      const { _id, _creationTime, formId, ...questionData } = q;
      await ctx.db.insert("questions", {
        formId: newFormId,
        ...questionData,
      });
    }

    return newFormId;
  },
});

export const deleteForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const form = await ctx.db.get(args.formId);
    if (!form) throw new ConvexError("Form not found");
    if (form.userId !== userId) throw new ConvexError("Not authorized to delete this form");

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

export const getDashboardStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const forms = await ctx.db
      .query("forms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let totalResponses = 0;
    let totalCompletedResponses = 0;

    for (const form of forms) {
      const responses = await ctx.db
        .query("responses")
        .withIndex("by_form", (q) => q.eq("formId", form._id))
        .collect();
      
      totalResponses += responses.length;
      totalCompletedResponses += responses.filter(r => r.status === "completed").length;
    }

    const avgCompletionRate = totalResponses > 0 ? (totalCompletedResponses / totalResponses) * 100 : 0;

    return {
      totalForms: forms.length,
      totalResponses,
      avgCompletionRate,
    };
  }
});
