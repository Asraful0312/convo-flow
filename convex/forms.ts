import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { assertAdmin, assertEditor, assertViewer } from "./auth_helpers";

export const getFormsForWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchQuery: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("published"), v.literal("draft"), v.literal("closed")),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { workspaceId, searchQuery, status, paginationOpts }) => {
    await assertViewer(ctx, workspaceId);

    let formsQuery;

    if (searchQuery) {
      formsQuery = ctx.db
        .query("forms")
        .withSearchIndex("by_title", (q) => q.search("title", searchQuery))
        .filter((q) => q.eq(q.field("workspaceId"), workspaceId));
    } else {
      formsQuery = ctx.db
        .query("forms")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
        .order("desc");
    }

    if (status) {
      formsQuery = formsQuery.filter((q) => q.eq(q.field("status"), status));
    }

    const forms = await formsQuery.paginate(paginationOpts);

    const pageWithResponseCount = await Promise.all(
      forms.page.map(async (form) => {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_form", (q) => q.eq("formId", form._id))
          .collect();
        return {
          ...form,
          responseCount: responses.length,
        };
      }),
    );

    return {
      ...forms,
      page: pageWithResponseCount,
    };
  },
});

export const getResponsesPageData = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args): Promise<any> => {
    const form = await ctx.db.get(args.formId);
    if (!form) {
      return null;
    }
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    await assertViewer(ctx, form.workspaceId);

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", form._id))
      .order("asc")
      .collect();

    const analytics = await ctx.runQuery(api.responses.getFormAnalytics, {
      formId: args.formId,
    });

    return {
      form,
      questions,
      analytics,
    };
  },
});

export const getResponseIds = query({
  args: {
    formId: v.id("forms"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) return [];
    if (!form.workspaceId) return [];
    await assertViewer(ctx, form.workspaceId);

    let responsesQuery = ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .order("desc");

    if (args.status && args.status !== "all") {
      responsesQuery = responsesQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const responses = await responsesQuery.collect();
    return responses.map((r) => r._id);
  },
});

export const getResponsesByIds = query({
  args: {
    responseIds: v.array(v.id("responses")),
  },
  handler: async (ctx, args) => {
    const responses = await Promise.all(
      args.responseIds.map(async (id) => {
        const response = await ctx.db.get(id);
        if (!response) return null;
        
        const firstAnswer = await ctx.db
          .query("answers")
          .withIndex("by_response", (q) => q.eq("responseId", response._id))
          .first();
          
        return { ...response, firstAnswer: firstAnswer || null };
      }),
    );
    
    return responses.filter((r) => r !== null);
  },
});

export const getSingleForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) {
      throw new ConvexError("Form not found");
    }
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    await assertViewer(ctx, form.workspaceId);

    return {
      ...form,
      questions: await ctx.db
        .query("questions")
        .withIndex("by_form", (q) => q.eq("formId", form._id))
        .collect(),
    };
  },
});

export const getFormForIntegrations = internalQuery({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) {
      return null;
    }
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    const workspace = await ctx.db.get(form.workspaceId);
    if (!workspace) {
      return null;
    }
    return {
      ...form,
      userId: workspace.ownerId, // For integrations that are user-based
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

    if (form.status !== "published") {
      return {
        ...form,
        questions: [],
        isOverResponseLimit: false,
        ownerName: "",
      };
    }

    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }

    const workspace = await ctx.db.get(form.workspaceId);
    if (!workspace) return null;

    const formOwner = await ctx.db.get(workspace.ownerId);
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

    const ownerWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", formOwner._id))
      .collect();
    const ownerWorkspaceIds = ownerWorkspaces.map((w) => w._id);

    let monthlyResponses = 0;
    for (const wsId of ownerWorkspaceIds) {
      const formsInWorkspace = await ctx.db
        .query("forms")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId))
        .collect();
      for (const f of formsInWorkspace) {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_form", (q) => q.eq("formId", f._id))
          .filter((q) => q.gt(q.field("startedAt"), startOfMonth.getTime()))
          .collect();
        monthlyResponses += responses.length;
      }
    }

    const isOverLimit = monthlyResponses >= limit;

    if (isOverLimit) {
      return {
        title: form.title,
        isOverResponseLimit: true,
        ownerName: formOwner.name,
      };
    }

    return {
      ...form,
      isOverResponseLimit: false,
      ownerName: formOwner.name,
      questions: await ctx.db
        .query("questions")
        .withIndex("by_form", (q) => q.eq("formId", form._id))
        .order("asc")
        .collect(),
    };
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.string(),
        required: v.boolean(),
        options: v.optional(
          v.array(
            v.union(
              v.string(),
              v.object({
                imageUrl: v.string(),
                text: v.string(),
              }),
            ),
          ),
        ),
        validation: v.optional(v.any()),
      }),
    ),
    settings: v.object({
      branding: v.optional(
        v.object({
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
          backgroundColor: v.optional(v.string()),
          font: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
          fontFamily: v.optional(v.string()),
          customCss: v.optional(v.string()),
        }),
      ),
      notifications: v.optional(
        v.object({
          emailOnResponse: v.optional(v.boolean()),
          notificationEmail: v.optional(v.string()),
          slackWebhook: v.optional(v.string()),
        }),
      ),
      closingDate: v.optional(v.number()),
      requireAuth: v.optional(v.boolean()),
      allowMultipleResponses: v.optional(v.boolean()),
      showProgressBar: v.optional(v.boolean()),
    }),
    aiConfig: v.object({
      personality: v.optional(
        v.union(
          v.literal("professional"),
          v.literal("friendly"),
          v.literal("casual"),
          v.literal("formal"),
        ),
      ),
      language: v.optional(v.string()),
      enableVoice: v.optional(v.boolean()),
      enableFollowUps: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId } = await assertEditor(ctx, args.workspaceId);
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");
    const owner = await ctx.db.get(workspace.ownerId);
    if (!owner) throw new ConvexError("Workspace owner not found");

    // Subscription checks from original function
    const subscriptionTier = owner.subscriptionTier || "free";
    if (subscriptionTier === "free") {
      // Simplified checks, can be expanded
      if (args.aiConfig && (args.aiConfig as any).enableVoice) {
        throw new ConvexError(
          "Voice features are not available on the free plan.",
        );
      }
    }

    console.log("args qusetions", args.questions);

    const formId = await ctx.db.insert("forms", {
      workspaceId: args.workspaceId,
      creatorId: userId,
      title: args.title,
      description: args.description,
      status: "draft",
      settings: args.settings ?? {},
      aiConfig: args.aiConfig ?? {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      await ctx.db.insert("questions", {
        formId,
        order: i,
        text: q.text,
        type: q.type as any,
        required: q.required,
        options: q.options,
        validation: q.validation,
      });
    }

    await ctx.runMutation(api.activities.logActivity, {
      workspaceId: args.workspaceId,
      userId,
      action: "form.create",
      details: { title: args.title },
    });

    return formId;
  },
});

export const createFormFromUpload = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        text: v.string(),
        type: v.string(),
        required: v.boolean(),
        options: v.optional(
          v.array(
            v.union(
              v.string(),
              v.object({
                imageUrl: v.string(),
                text: v.string(),
              }),
            ),
          ),
        ),
        validation: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await assertEditor(ctx, args.workspaceId);

    const formId = await ctx.db.insert("forms", {
      workspaceId: args.workspaceId,
      creatorId: userId,
      title: args.title,
      description: args.description,
      status: "draft",
      settings: {},
      aiConfig: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      await ctx.db.insert("questions", {
        formId,
        order: i,
        text: q.text,
        type: q.type as any,
        required: q.required,
        options: q.options,
        validation: q.validation,
      });
    }

    await ctx.runMutation(api.activities.logActivity, {
      workspaceId: args.workspaceId,
      userId,
      action: "form.create",
      details: { title: args.title, source: "upload" },
    });

    return formId;
  },
});

// Update form settings
export const updateSettings = mutation({
  args: {
    formId: v.id("forms"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("closed")),
    ),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    font: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    // notifications
    emailOnResponse: v.optional(v.boolean()),
    notificationEmail: v.optional(v.string()),
    personality: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("friendly"),
        v.literal("casual"),
        v.literal("formal"),
      ),
    ),
    voiceEnabled: v.optional(v.boolean()),
    allowSaveAndResume: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) throw new ConvexError("Form not found");
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    const { userId } = await assertEditor(ctx, form.workspaceId);
    const user = await ctx.db.get(userId);

    if (!user) {
      throw new ConvexError("UnAuthorized");
    }

    const emailOnResponse =
      args.emailOnResponse ?? form.settings?.notifications?.emailOnResponse;
    const notificationEmail =
      args.notificationEmail ?? form.settings?.notifications?.notificationEmail;

    if (emailOnResponse && !notificationEmail) {
      throw new ConvexError(
        "A notification email must be provided if email on response is enabled.",
      );
    }

    const subscriptionTier = user.subscriptionTier || "free";

    if (subscriptionTier) {
      if (subscriptionTier === "free") {
        // Branding restriction
        const hasCustomBranding =
          (args.logoUrl && args.logoUrl !== form.settings?.branding?.logoUrl) ||
          (args.primaryColor &&
            args.primaryColor !== form.settings?.branding?.primaryColor) ||
          (args.secondaryColor &&
            args.secondaryColor !== form.settings?.branding?.secondaryColor) ||
          (args.backgroundColor &&
            args.backgroundColor !== form.settings?.branding?.backgroundColor) ||
          (args.font && args.font !== form.settings?.branding?.font);

        if (args.primaryColor !== "#f56a4d" && hasCustomBranding) {
          throw new ConvexError(
            "Custom branding is not available on the free plan.",
          );
        }

        // Voice restriction
        if (args.voiceEnabled === true) {
          throw new ConvexError(
            "Voice features are not available on the free plan.",
          );
        }

        // Publish limit restriction
        if (args.status === "published") {
          const userForms = await ctx.db
            .query("forms")
            .withIndex("by_workspace", (q) =>
              q.eq("workspaceId", form.workspaceId),
            )
            .filter((q) => q.eq(q.field("status"), "published"))
            .collect();

          const isAlreadyPublished = form.status === "published";
          if (!isAlreadyPublished && userForms.length >= 3) {
            throw new ConvexError(
              "You can only have 3 active (published) forms on the free plan.",
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
    if (
      args.primaryColor !== undefined ||
      args.secondaryColor !== undefined ||
      args.backgroundColor !== undefined ||
      args.font !== undefined ||
      args.logoUrl !== undefined
    ) {
      updatedSettings.branding = {
        ...(form.settings?.branding ?? {}),
        ...(args.primaryColor && { primaryColor: args.primaryColor }),
        ...(args.secondaryColor && { secondaryColor: args.secondaryColor }),
        ...(args.backgroundColor && { backgroundColor: args.backgroundColor }),
        ...(args.font && { font: args.font }),
        ...(args.logoUrl && { logoUrl: args.logoUrl }),
      };
    }

    // Update notifications
    if (
      args.emailOnResponse !== undefined ||
      args.notificationEmail !== undefined
    ) {
      updatedSettings.notifications = {
        ...(form.settings?.notifications ?? {}),
        ...(args.emailOnResponse !== undefined && {
          emailOnResponse: args.emailOnResponse,
        }),
        ...(args.notificationEmail !== undefined && {
          notificationEmail: args.notificationEmail,
        }),
      };
    }

    if (args.allowSaveAndResume !== undefined) {
      updatedSettings.allowSaveAndResume = args.allowSaveAndResume;
    }

    if (Object.keys(updatedSettings).length > 0) {
      patch.settings = updatedSettings;
    }

    // AI Config
    if (args.personality !== undefined || args.voiceEnabled !== undefined) {
      patch.aiConfig = {
        ...(form.aiConfig ?? {}),
        ...(args.personality && { personality: args.personality }),
        ...(args.voiceEnabled !== undefined && {
          enableVoice: args.voiceEnabled,
        }),
      };
    }

    await ctx.db.patch(args.formId, patch);

    if (args.status && args.status !== form.status) {
      await ctx.runMutation(api.activities.logActivity, {
        workspaceId: form.workspaceId,
        userId,
        action: "form.updateStatus",
        details: { title: form.title, status: args.status },
      });
    }

    return args.formId;
  },
});

export const duplicateForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const originalForm = await ctx.db.get(args.formId);
    if (!originalForm) throw new ConvexError("Form not found");
    if (!originalForm.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    const { userId } = await assertEditor(ctx, originalForm.workspaceId);

    const originalQuestions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .order("asc")
      .collect();

    const newFormId = await ctx.db.insert("forms", {
      workspaceId: originalForm.workspaceId,
      creatorId: userId,
      title: `${originalForm.title} (Copy)`,
      description: originalForm.description,
      status: "draft",
      settings: originalForm.settings,
      aiConfig: originalForm.aiConfig,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    for (const q of originalQuestions) {
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
    const form = await ctx.db.get(args.formId);
    if (!form) throw new ConvexError("Form not found");
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    await assertAdmin(ctx, form.workspaceId);

    const responses = await ctx.db
      .query("responses")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();
    await Promise.all(responses.map((r) => ctx.db.delete(r._id)));

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_form", (q) => q.eq("formId", args.formId))
      .collect();
    await Promise.all(questions.map((q) => ctx.db.delete(q._id)));

    await ctx.db.delete(args.formId);

    return { deletedFormId: args.formId };
  },
});

export const updateFormIntegrationMapping = mutation({
  args: {
    formId: v.id("forms"),
    integrationType: v.literal("notion"),
    mapping: v.object({
      databaseId: v.string(),
      mapping: v.array(
        v.object({
          questionId: v.string(),
          notionPropertyId: v.string(),
          notionPropertyName: v.string(),
        }),
      ),
    }),
  },
  handler: async (ctx, { formId, integrationType, mapping }) => {
    const form = await ctx.db.get(formId);
    if (!form) throw new ConvexError("Form not found");
    if (!form.workspaceId) {
      throw new ConvexError("Workspace required");
    }
    await assertEditor(ctx, form.workspaceId);

    const currentMappings = form.integrationMappings ?? {};

    await ctx.db.patch(formId, {
      integrationMappings: {
        ...currentMappings,
        [integrationType]: mapping,
      },
    });
  },
});

export const getDashboardStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await assertViewer(ctx, workspaceId);

    const forms = await ctx.db
      .query("forms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    let totalResponses = 0;
    let totalCompletedResponses = 0;

    for (const form of forms) {
      const responses = await ctx.db
        .query("responses")
        .withIndex("by_form", (q) => q.eq("formId", form._id))
        .collect();

      totalResponses += responses.length;
      totalCompletedResponses += responses.filter(
        (r) => r.status === "completed",
      ).length;
    }

    const rawAvgCompletionRate =
      totalResponses > 0 ? (totalCompletedResponses / totalResponses) * 100 : 0;
    const avgCompletionRate = Math.min(100, rawAvgCompletionRate);

    return {
      totalForms: forms.length,
      totalResponses,
      avgCompletionRate,
    };
  },
});
