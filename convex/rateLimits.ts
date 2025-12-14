import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/**
 * Rate limiter configuration for AI-powered features.
 * 
 * Rate limits are per-user to prevent abuse of expensive OpenAI calls.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // AI Form Generation: 10 per minute with burst capacity of 3
  // Allows users to quickly iterate but prevents spam
  generateForm: { 
    kind: "token bucket", 
    rate: 10, 
    period: MINUTE, 
    capacity: 3 
  },
  
  // AI Form Generation from Text/PDF: 5 per minute
  // More expensive operation, stricter limit
  generateFormFromText: { 
    kind: "token bucket", 
    rate: 5, 
    period: MINUTE, 
    capacity: 2 
  },
  
  // AI Answer Validation: 60 per minute (needed for conversational form)
  // Higher limit since it's used during form filling
  validateAnswer: { 
    kind: "token bucket", 
    rate: 60, 
    period: MINUTE, 
    capacity: 10 
  },
  
  // AI Conversational Question Generation: 60 per minute
  getConversationalQuestion: { 
    kind: "token bucket", 
    rate: 60, 
    period: MINUTE, 
    capacity: 10 
  },
  
  // AI Insights Generation: 20 per minute
  generateInsights: { 
    kind: "token bucket", 
    rate: 20, 
    period: MINUTE, 
    capacity: 5 
  },
});
