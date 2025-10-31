"use action"

import { action } from "./_generated/server"
import { v } from "convex/values"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateForm = action({
  args: {
    prompt: v.string(),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("ai")),
        content: v.string(),
      })
    ),
  },
  handler: async (_, { prompt, conversationHistory }) => {
    const systemPrompt = `
      You are an expert at creating forms. A user will provide a description of a form they want to create.
      You must return a JSON object representing the form.
      The JSON object should have the following structure:
      {
        "title": "Your Form Title",
        "description": "A description of your form.",
        "questions": [
          {
            "id": "A unique ID for the question, e.g., 'q1'",
            "form_id": "new",
            "order": 1,
            "text": "The question text",
            "type": "text" | "email" | "choice",
            "required": true | false,
            "options": ["Option 1", "Option 2"]
          }
        ],
        "settings": {
        "branding": { "primaryColor": "#6366f1" },
        "notifications": { "emailOnResponse": true, "notificationEmail": "you@example.com" },
        "aiConfig": { "personality": "friendly", "voiceEnabled": false }
        }
      }
      Make sure the 'type' is one of the supported types: "text", "email", "number", "phone", "url", "textarea", "choice", "multiple_choice", "dropdown", "rating", "scale", "date", "time", "file".
      For 'choice' type questions, provide a list of strings in the 'options' field.
      Do not include any extra text or explanations in your response, only the JSON object.
    `

    const adaptedHistory = conversationHistory.map((msg) => ({
      role: msg.role === "ai" ? ("assistant" as const) : ("user" as const),
      content: msg.content,
    }))

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...adaptedHistory,
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const responseContent = response.choices[0].message.content

    if (!responseContent) {
      throw new Error("Failed to generate form: No response from AI.")
    }

    try {
      const form = JSON.parse(responseContent)
      return form
    } catch (e) {
      console.error("Failed to parse AI response:", e)
      console.error("Raw response:", responseContent)
      throw new Error("Failed to generate form: Invalid JSON response from AI.")
    }
  },
})