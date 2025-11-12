import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // Workspaces table
  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  // Workspace members table
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  })
    .index("by_workspace_and_user", ["workspaceId", "userId"])
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"]),

  // Invites table
  invites: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
  })
    .index("by_workspace_and_email", ["workspaceId", "email"])
    .index("by_email", ["email"]),

  // Users table
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Workspace info
    activeWorkspaceId: v.optional(v.id("workspaces")),

    //custom fields
    subscriptionTier: v.optional(
      v.union(
        v.literal("free"),
        v.literal("pro"),
        v.literal("business"),
        v.literal("enterprise"),
      ),
    ),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("trialing"),
        v.literal("incomplete"),
        v.literal("incomplete_expired"),
        v.literal("unpaid"),
      ),
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_subscription", ["subscriptionTier", "subscriptionStatus"]),

  // Forms table
  forms: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    creatorId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("closed"),
    ),
    // Settings include branding, notifications, etc.
    settings: v.object({
      branding: v.optional(
        v.object({
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
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
    // AI configuration
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
    integrationMappings: v.optional(
      v.object({
        notion: v.optional(
          v.object({
            databaseId: v.string(),
            mapping: v.array(
              v.object({
                questionId: v.string(),
                notionPropertyId: v.string(),
                notionPropertyName: v.string(),
              }),
            ),
          }),
        ),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["status"])
    .index("by_workspace_and_status", ["workspaceId", "status"])
    .index("by_created", ["createdAt"])
    .searchIndex("by_title", { searchField: "title" }),

  // Questions table
  questions: defineTable({
    formId: v.id("forms"),
    order: v.number(),
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
    text: v.string(),
    description: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    // Options for choice-based questions
    options: v.optional(v.array(v.string())),
    // Validation rules
    validation: v.optional(
      v.object({
        required: v.optional(v.boolean()),
        minLength: v.optional(v.number()),
        maxLength: v.optional(v.number()),
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        pattern: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
      }),
    ),
    required: v.boolean(),
    // Conditional logic
    conditionalLogic: v.optional(
      v.object({
        enabled: v.boolean(),
        conditions: v.array(
          v.object({
            questionId: v.string(),
            operator: v.union(
              v.literal("equals"),
              v.literal("not_equals"),
              v.literal("contains"),
              v.literal("greater_than"),
              v.literal("less_than"),
            ),
            value: v.any(),
          }),
        ),
        action: v.union(
          v.literal("show"),
          v.literal("hide"),
          v.literal("skip"),
        ),
      }),
    ),
  })
    .index("by_form", ["formId"])
    .index("by_form_and_order", ["formId", "order"]),

  // Responses table
  responses: defineTable({
    formId: v.id("forms"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    // Metadata includes device, location, referrer, etc.
    metadata: v.object({
      device: v.optional(v.string()),
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      location: v.optional(
        v.object({
          country: v.optional(v.string()),
          city: v.optional(v.string()),
          region: v.optional(v.string()),
        }),
      ),
      referrer: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    }),
    // Contact info if collected
    contactInfo: v.optional(
      v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
      }),
    ),
    // Quality and sentiment scores
    qualityScore: v.optional(v.number()),
    sentimentScore: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    summary: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    actionableInsights: v.optional(v.array(v.string())),
  })
    .index("by_form", ["formId"])
    .index("by_status", ["status"])
    .index("by_form_and_status", ["formId", "status"])
    .index("by_completed", ["completedAt"])
    .index("by_started", ["startedAt"]),

  // Answers table
  answers: defineTable({
    responseId: v.id("responses"),
    questionId: v.id("questions"),
    // Value can be any type depending on question type
    value: v.any(),
    // For file uploads
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_response", ["responseId"])
    .index("by_question", ["questionId"])
    .index("by_response_and_question", ["responseId", "questionId"]),

  // Conversations table - stores the chat history
  conversations: defineTable({
    responseId: v.id("responses"),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("assistant"), v.literal("user")),
        content: v.string(),
        timestamp: v.number(),
        questionId: v.optional(v.string()),
        isAdaptive: v.optional(v.boolean()),
      }),
    ),
    // AI context for maintaining conversation state
    aiContext: v.optional(
      v.object({
        currentQuestionIndex: v.optional(v.number()),
        answeredQuestions: v.optional(v.array(v.string())),
        skippedQuestions: v.optional(v.array(v.string())),
        conversationSummary: v.optional(v.string()),
      }),
    ),
  }).index("by_response", ["responseId"]),

  // Webhooks table
  webhooks: defineTable({
    userId: v.id("users"),
    formId: v.optional(v.id("forms")),
    name: v.string(),
    url: v.string(),
    events: v.array(
      v.union(
        v.literal("response.created"),
        v.literal("response.updated"),
        v.literal("response.completed"),
      ),
    ),
    enabled: v.boolean(),
    secret: v.optional(v.string()),
    createdAt: v.number(),
    lastTriggeredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_form", ["formId"])
    .index("by_enabled", ["enabled"]),

  // Integrations table
  integrations: defineTable({
    userId: v.id("users"),
    formId: v.optional(v.id("forms")),
    type: v.union(
      v.literal("zapier"),
      v.literal("slack"),
      v.literal("google_sheets"),
      v.literal("airtable"),
      v.literal("notion"),
      v.literal("hubspot"),
      v.literal("salesforce"),
      v.literal("email"),
    ),
    name: v.string(),
    config: v.any(), // Configuration specific to each integration type
    enabled: v.boolean(),
    createdAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_form", ["formId"])
    .index("by_type", ["type"]),

  oauth_temp_storage: defineTable({
    userId: v.id("users"),
    service: v.string(), // e.g., "airtable"
    codeVerifier: v.string(),
    expiresAt: v.number(),
  }).index("by_user_and_service", ["userId", "service"]),

  // Analytics events table
  analyticsEvents: defineTable({
    formId: v.id("forms"),
    responseId: v.optional(v.id("responses")),
    eventType: v.union(
      v.literal("form_viewed"),
      v.literal("form_started"),
      v.literal("question_answered"),
      v.literal("question_skipped"),
      v.literal("form_completed"),
      v.literal("form_abandoned"),
    ),
    eventData: v.optional(v.any()),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_form", ["formId"])
    .index("by_response", ["responseId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_form_and_type", ["formId", "eventType"]),

  // AI insights table - stores AI-generated insights
  aiInsights: defineTable({
    formId: v.id("forms"),
    responseId: v.optional(v.id("responses")),
    insightType: v.union(
      v.literal("sentiment"),
      v.literal("themes"),
      v.literal("summary"),
      v.literal("anomaly"),
      v.literal("suggestion"),
    ),
    content: v.string(),
    data: v.optional(v.any()),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_form", ["formId"])
    .index("by_response", ["responseId"])
    .index("by_type", ["insightType"])
    .index("by_created", ["createdAt"]),
});
