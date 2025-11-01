// Mock data for development before database integration
import type { Form, Question, Response, User, Answer } from "./types"

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
      text: "What's your name?",
      required: true,
    },
    {
      id: "q2",
      form_id: "1",
      order: 2,
      type: "email",
      text: "What's your email address?",
      required: true,
      validation: [{ type: "email", message: "Hmm, that email doesn't look right. Mind double-checking?" }],
    },
    {
      id: "q3",
      form_id: "1",
      order: 3,
      type: "choice",
      text: "How would you rate our product?",
      required: true,
      options: ["⭐ Poor", "⭐⭐ Fair", "⭐⭐⭐ Good", "⭐⭐⭐⭐ Great", "⭐⭐⭐⭐⭐ Excellent"],
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
  "2": [
    {
      id: "q1",
      form_id: "2",
      order: 1,
      type: "text",
      text: "What's your full name?",
      required: true,
    },
    {
      id: "q2",
      form_id: "2",
      order: 2,
      type: "email",
      text: "What's your email?",
      required: true,
    },
    {
      id: "q3",
      form_id: "2",
      order: 3,
      type: "choice",
      text: "Which session are you interested in?",
      required: true,
      options: ["Morning Session (9 AM)", "Afternoon Session (2 PM)", "Evening Session (6 PM)"],
    },
  ],
  "3": [
    {
      id: "q1",
      form_id: "3",
      order: 1,
      type: "text",
      text: "What's your company name?",
      required: true,
    },
    {
      id: "q2",
      form_id: "3",
      order: 2,
      type: "choice",
      text: "What's your company size?",
      required: true,
      options: ["1-10 employees", "11-50 employees", "51-200 employees", "200+ employees"],
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
  {
    id: "r3",
    form_id: "1",
    status: "abandoned",
    started_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    metadata: {
      device: "tablet",
      browser: "Safari",
      os: "iPadOS",
    },
  },
  {
    id: "r4",
    form_id: "1",
    status: "in_progress",
    started_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    metadata: {
      device: "desktop",
      browser: "Firefox",
      os: "Windows",
    },
  },
  {
    id: "r5",
    form_id: "1",
    status: "completed",
    started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
    metadata: {
      device: "mobile",
      browser: "Chrome",
      os: "Android",
    },
  },
]

export const mockAnswers: Record<string, Answer[]> = {
  r1: [
    {
      id: "a1",
      response_id: "r1",
      question_id: "q1",
      value: "Sarah Johnson",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a2",
      response_id: "r1",
      question_id: "q2",
      value: "sarah.johnson@example.com",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a3",
      response_id: "r1",
      question_id: "q3",
      value: "⭐⭐⭐⭐⭐ Excellent",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a4",
      response_id: "r1",
      question_id: "q4",
      value: "The product is amazing! Love the new features.",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  r2: [
    {
      id: "a5",
      response_id: "r2",
      question_id: "q1",
      value: "Michael Chen",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a6",
      response_id: "r2",
      question_id: "q2",
      value: "michael.chen@example.com",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a7",
      response_id: "r2",
      question_id: "q3",
      value: "⭐⭐⭐⭐ Great",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a8",
      response_id: "r2",
      question_id: "q4",
      value: "Could use better mobile support",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
  r3: [
    {
      id: "a9",
      response_id: "r3",
      question_id: "q1",
      value: "Emily Rodriguez",
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a10",
      response_id: "r3",
      question_id: "q2",
      value: "emily.r@example.com",
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a11",
      response_id: "r3",
      question_id: "q3",
      value: "⭐⭐⭐ Good",
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ],
  r4: [
    {
      id: "a12",
      response_id: "r4",
      question_id: "q1",
      value: "David Kim",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a13",
      response_id: "r4",
      question_id: "q2",
      value: "david.kim@example.com",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
  r5: [
    {
      id: "a14",
      response_id: "r5",
      question_id: "q1",
      value: "Jessica Martinez",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a15",
      response_id: "r5",
      question_id: "q2",
      value: "jessica.m@example.com",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a16",
      response_id: "r5",
      question_id: "q3",
      value: "⭐⭐⭐⭐⭐ Excellent",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "a17",
      response_id: "r5",
      question_id: "q4",
      value: "Everything is perfect! Keep up the great work.",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}
