// Core data types matching the database schema from PRD

export type SubscriptionTier = "free" | "pro" | "business" | "enterprise"
export type SubscriptionStatus = "active" | "canceled" | "past_due"
export type FormStatus = "draft" | "published" | "closed"
export type ResponseStatus = "in_progress" | "completed" | "abandoned"

export type QuestionType =
  | "text"
  | "email"
  | "number"
  | "choice"
  | "multiple_choice"
  | "date"
  | "time"
  | "file"
  | "rating"
  | "likert"
  | "textarea"
  | "phone"
  | "dropdown"     
  | "url"         
  | "scale"      

  

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
}

export type FormSettings = {
  branding?: {
    primaryColor?: string
    logoUrl?: string
  }
  notifications?: {
    emailOnResponse?: boolean
    notificationEmail?: string
  }
  aiConfig?: {
    personality?: "professional" | "friendly" | "casual" | "formal"
    voiceEnabled?: boolean
  }
}

export type GeneratedForm = {
  title: string
  description: string
  questions: Question[]
  settings?: FormSettings
}

export interface AIConfig {
  personality?: "friendly" | "professional" | "casual"
  language?: string
  voice_enabled?: boolean
}

export interface Form {
  id: string
  user_id: string
  title: string
  description?: string
  status: FormStatus
  settings: FormSettings
  ai_config: AIConfig
  created_at: string
  updated_at: string
  published_at?: string
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "email"
  value?: string | number
  message?: string
}

export interface ConditionalLogic {
  condition: {
    question_id: string
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than"
    value: string | number
  }
  action: "show" | "hide" | "skip_to"
  target_question_id?: string
}

export interface Question {
  id: string
  form_id: string
  order: number
  type: QuestionType
  text: string
  options?: string[]
  validation?: ValidationRule[]
  required: boolean
  conditional_logic?: ConditionalLogic
}

export interface ResponseMetadata {
  device?: string
  browser?: string
  os?: string
  location?: string
  referrer?: string
}

export interface Response {
  id: string
  form_id: string
  status: ResponseStatus
  started_at: string
  completed_at?: string
  metadata: ResponseMetadata
}

export interface Answer {
  id: string
  response_id: string
  question_id: string
  value: string | string[] | number | boolean
  created_at: string
}

export interface Message {
  id: string
  role: "ai" | "user" | "system"
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  response_id: string
  messages: Message[]
  ai_context: Record<string, unknown>
}

// Analytics types
export interface FormAnalytics {
  total_responses: number
  completion_rate: number
  average_time: number
  drop_off_points: { question_id: string; rate: number }[]
  device_breakdown: { device: string; count: number }[]
  geographic_distribution: { location: string; count: number }[]
}

export interface AIInsight {
  type: "sentiment" | "theme" | "anomaly" | "suggestion"
  title: string
  description: string
  confidence: number
  data?: Record<string, unknown>
}


