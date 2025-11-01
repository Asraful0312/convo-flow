"use action"

import { action } from "./_generated/server"
import { v } from "convex/values"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const getConversationalQuestion = action({
  args: {
    question: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("ai")),
        content: v.string(),
      })
    ),
  },
  handler: async (_, { question, history }) => {
    const systemPrompt = `
      You are a friendly, conversational assistant.
      Given a conversation history and a new question to ask, your task is to make the new question flow naturally with the conversation.
      You can add a brief transitional phrase or rephrase the question itself.
      For example, if the previous answer was about their favorite color, and the new question is "What is your job?", you could say:
      "Interesting! Now, shifting gears a bit, what do you do for work?"
      Keep it concise and friendly.
      Just return the rephrased question as a single string. Do not add any other text or JSON formatting.
    `

    const adaptedHistory = history.map((msg) => ({
      role: msg.role === "ai" ? ("assistant" as const) : ("user" as const),
      content: msg.content,
    }))

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...adaptedHistory,
        {
          role: "user",
          content: `Here is the next question to ask: "${question}"`,
        },
      ],
    })

    const responseContent = response.choices[0].message.content

    if (!responseContent) {
      // Fallback to original question if AI fails
      return question
    }

    return responseContent.trim()
  },
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