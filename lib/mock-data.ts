// Mock data for development before database integration
import type { Form, Question, Response, User } from "./types"

export const mockUser: User = {
  id: "1",
  email: "demo@convoflow.com",
  name: "Demo User",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  subscription_tier: "pro",
  subscription_status: "active",
}

export const mockForms: Form[] = [
  {
    id: "1",
    user_id: "1",
    title: "Customer Feedback Survey",
    description: "Help us improve our product",
    status: "published",
    settings: {
      branding: {
        primary_color: "#6366f1",
      },
      notifications: {
        email_on_response: true,
        notification_email: "demo@convoflow.com",
      },
    },
    ai_config: {
      personality: "friendly",
      language: "en",
      voice_enabled: true,
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    user_id: "1",
    title: "Event Registration",
    description: "Register for our upcoming webinar",
    status: "published",
    settings: {
      branding: {
        primary_color: "#f97316",
      },
    },
    ai_config: {
      personality: "professional",
      language: "en",
    },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    user_id: "1",
    title: "Lead Qualification Form",
    description: "Qualify leads for sales team",
    status: "draft",
    settings: {},
    ai_config: {
      personality: "professional",
      language: "en",
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockQuestions: Record<string, Question[]> = {
  "1": [
    {
      id: "q1",
      form_id: "1",
      order: 1,
      type: "text",
      text: "What is your name?",
      required: true,
    },
    {
      id: "q2",
      form_id: "1",
      order: 2,
      type: "email",
      text: "What is your email address?",
      required: true,
      validation: [{ type: "email", message: "Please enter a valid email" }],
    },
    {
      id: "q3",
      form_id: "1",
      order: 3,
      type: "rating",
      text: "How would you rate our product?",
      required: true,
    },
    {
      id: "q4",
      form_id: "1",
      order: 4,
      type: "text",
      text: "What could we improve?",
      required: false,
    },
  ],
}

export const mockResponses: Response[] = [
  {
    id: "r1",
    form_id: "1",
    status: "completed",
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    metadata: {
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
    },
  },
  {
    id: "r2",
    form_id: "1",
    status: "completed",
    started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    metadata: {
      device: "mobile",
      browser: "Safari",
      os: "iOS",
    },
  },
]
