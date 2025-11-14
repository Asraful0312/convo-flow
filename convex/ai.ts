import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI();

export const generateForm = action({
  args: {
    prompt: v.string(),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("ai")),
          content: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, { prompt, conversationHistory }) => {
    const userMessage = `Generate a form based on this prompt: ${prompt}`;
    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert form generation assistant named CANDID. Your goal is to create a structured JSON representation of a form based on a user's prompt.

You must generate a JSON object with the following structure:
{
  "title": "Form Title",
  "description": "A brief description of the form.",
  "questions": [
    {
      "text": "The question to ask the user.",
      "type": "question_type",
      "required": true/false,
      "options": ["Option 1", "Option 2"] // Only for choice-based questions
    }
  ]
}

CRITICAL INSTRUCTIONS:
1.  **Interpret Intent:** Carefully analyze the user's prompt to understand the purpose of the form and the specific questions and types required.
2.  **Accurate Question Types:** You MUST use one of the following supported question types:
    *   \`text\`: For short text answers (e.g., Name, City).
    *   \`textarea\`: For long text answers (e.g., Feedback, Comments).
    *   \`email\`: For email addresses.
    *   \`phone\`: For phone numbers.
    *   \`url\`: For website URLs.
    *   \`number\`: For numerical input.
    *   \`currency\`: For monetary values.
    *   \`choice\`: For single-selection questions (radio buttons).
    *   \`multiple_choice\`: For multiple-selection questions (checkboxes).
    *   \`dropdown\`: For single-selection from a dropdown list.
    *   \`rating\`: For a 1-5 star rating.
    *   \`scale\`: For a 1-10 numerical scale.
    *   \`date\`: For a single date picker.
    *   \`date_range\`: For selecting a start and end date.
    *   \`time\`: For a time picker.
    *   \`file\`: For file uploads.
    *   \`location\`: For picking an address or location on a map.
    *   \`yes_no\`: For a binary yes/no question.
    *   \`image_choice\`: For selecting from a list of images.
3.  **Handle Complex Requests:** If the user asks for a "customer feedback survey with rating scales and open-ended questions", you must include \`rating\` or \`scale\` questions and \`textarea\` questions. Do not default to a generic contact form.
4.  **Ambiguity Handling:** If the user's prompt is too vague or ambiguous to create a detailed form (e.g., "Make a form"), do NOT invent details. Instead, you MUST ask a clarifying question. To do this, return a JSON object with a single key "clarification".
    *   Example for ambiguous prompt:
    *   User Prompt: "A form for my business"
    *   Your JSON Output: \`{ "clarification": "Of course! What kind of form do you need for your business? For example, is it for contact, customer feedback, or something else?" }\`
5.  **Options:**
    *   For \`choice\`, \`multiple_choice\`, and \`dropdown\` questions, you MUST provide an array of strings in the \`options\` field.
    *   For \`image_choice\` questions, you MUST provide an array of objects in the \`options\` field, where each object has a \`text\` (string) and an \`imageUrl\` (string). Example: \`[{ "text": "Option 1", "imageUrl": "https://example.com/image1.png" }]\`
6.  **Required Fields:** Use your best judgment to mark fields as \`required\`. For example, a name or email in a contact form should usually be required.
7.  **JSON Output:** Your entire response MUST be a single, valid JSON object. Do not include any text or explanations outside of the JSON structure.

EXAMPLE (Good Prompt):
User Prompt: "Create a customer satisfaction survey about our new product. Ask for their name, email, a rating from 1 to 10 for the product, and some open feedback."

Your JSON Output:
{
  "title": "Customer Satisfaction Survey",
  "description": "Thank you for taking the time to provide feedback on our new product. Your input is valuable to us.",
  "questions": [
    {
      "text": "What is your full name?",
      "type": "text",
      "required": true
    },
    {
      "text": "What is your email address?",
      "type": "email",
      "required": true
    },
    {
      "text": "On a scale of 1 to 10, how would you rate our new product?",
      "type": "scale",
      "required": true
    },
    {
      "text": "Do you have any other feedback for us?",
      "type": "textarea",
      "required": false
    }
  ]
}`,
      },
      ...(conversationHistory || []).map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      response_format: { type: "json_object" },
    });

    const formJson = response.choices[0].message.content;
    const parsedJson = JSON.parse(formJson || "{}");

    // The handler now returns the parsed JSON, which could be a form or a clarification.
    return parsedJson;
  },
});

export const getConversationalQuestion = action({
  args: {
    question: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("ai")),
        content: v.string(),
      }),
    ),
    personality: v.optional(v.string()),
    userName: v.optional(v.string()),
    previousAnswer: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { question, history, personality, userName, previousAnswer },
  ) => {
    const personalityPrompt =
      {
        professional:
          "You are a professional assistant. Your tone is courteous and clear.",
        friendly:
          "You are a friendly assistant. Your tone is warm and encouraging.",
        casual:
          "You are a casual assistant. Your tone is relaxed and conversational.",
        formal:
          "You are a formal assistant. Your tone is respectful and precise.",
      }[personality || "friendly"] || "You are a helpful assistant.";

    const messages: any[] = [
      {
        role: "system",
        content: `You are CANDID, an intelligent and conversational AI assistant. Your personality is: helpful, confident, and modern. Your goal is to make filling out this form feel like a natural and pleasant chat.

Your task is to rephrase the upcoming form question to make it more engaging.

${userName ? `The user's name is ${userName}. Use it occasionally to make the conversation personal.` : ""}

Here's how to do it:
1.  **Acknowledge (if applicable):** If the user just provided an answer ("${previousAnswer}"), give a brief, natural acknowledgement. Examples: "Got it, thanks!", "Perfect.", "Thanks, ${userName}."
2.  **Rephrase the Question:** Transform the raw question into a friendly, conversational one.
    *   Instead of "Email", ask "What's the best email for us to reach you at?".
    *   Instead of "Full Name", ask "What's your full name?".
3.  **Adapt to Personality:** The base personality is friendly and professional. Adapt based on the selected form personality:
    *   \`professional\`: More courteous and clear.
    *   \`friendly\`: Warm and encouraging.
    *   \`casual\`: Relaxed and conversational.
    *   \`formal\`: Respectful and precise.
4.  **Be Concise:** Keep it short and to the point.
5.  **CRITICAL:** Only return the rephrased question text. Do not add extra greetings or conversational filler.

The goal is a smooth, engaging conversation that gets the form filled out efficiently.`,
      },
      ...history.map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: `Rephrase: "${question}"` },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
    });

    return response.choices[0].message.content;
  },
});

export const validateAnswer = action({
  args: {
    question: v.string(),
    answer: v.string(),
    personality: v.string(),
  },
  handler: async (ctx, { question, answer, personality }) => {
    const personalityPrompt =
      {
        professional: "You are a professional assistant.",
        friendly: "You are a friendly assistant.",
        casual: "You are a casual assistant.",
        formal: "You are a formal assistant.",
      }[personality] || "You are a helpful assistant.";

    const messages: any[] = [
      {
        role: "system",
        content: `You are CANDID, an intelligent and helpful AI assistant. You are validating a user's answer on a form. Your tone should be helpful and confident, never condescending.

The user has provided an answer to a question. Determine if the answer is valid and makes sense for the question.

- If the answer is valid, return: \`{"isValid": true}\`
- If the answer is nonsensical, gibberish, clearly incorrect, or doesn't fit the question, return: \`{"isValid": false, "reason": "A polite, conversational, and helpful message explaining why the answer seems incorrect and asking for a better one."}\`

Your goal is to gently guide the user to provide a correct answer while maintaining a positive and friendly conversation.

Example 1:
Question: "What is your email address?"
Answer: "blabla"
Response: \`{"isValid": false, "reason": "Hmm, that doesn't look like a valid email address. Could you please double-check it?"}\`

Example 2:
Question: "What is your phone number?"
Answer: "not telling you"
Response: \`{"isValid": false, "reason": "I understand. We need a phone number to proceed. Could you please provide one?"}\`

Example 3:
Question: "What's your favorite color?"
Answer: "the sound of rain"
Response: \`{"isValid": false, "reason": "That's a beautiful thought! But for this question, I need an actual color. What's your favorite?"}\`

Example 4:
Question: "What is your name?"
Answer: "John Doe"
Response: \`{"isValid": true}\`

Your response MUST be a valid JSON object.`,
      },
      {
        role: "user",
        content: `Question: "${question}"
Answer: "${answer}"`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      response_format: { type: "json_object" },
    });

    const validationResult = JSON.parse(
      response.choices[0].message.content || "{}",
    );
    return validationResult;
  },
});

export const generateInsights = internalAction({
  args: { responseId: v.id("responses") },
  handler: async (ctx, { responseId }) => {
    const responseData = await ctx.runQuery(
      api.responses.getResponseWithAnswers,
      { responseId },
    );
    if (!responseData) return;

    const answersText = responseData.answers
      .map((a) => `Q: ${a.questionId}\nA: ${a.value}`)
      .join("\n\n");

    const prompt = `You are a data analyst AI. Your task is to analyze a submitted form response and extract meaningful insights.

The response is provided below:
${answersText}

Based on the response, provide the following in a valid JSON format:
1.  \`sentiment\`: The overall sentiment of the response. Must be one of "Positive", "Negative", or "Neutral".
2.  \`summary\`: A concise, one-sentence summary of the user's response.
3.  \`keyThemes\`: An array of strings representing the main topics or themes mentioned (e.g., "Pricing", "Customer Support", "Product Quality").
4.  \`actionableInsights\`: An array of strings with specific, actionable suggestions for the form owner based on this single response. If the sentiment is positive, suggest what to double down on. If negative, suggest areas for improvement.

Example JSON output:
{
  "sentiment": "Negative",
  "summary": "The user is unhappy with the product's price and experienced a bug.",
  "keyThemes": ["Pricing", "Bugs", "User Experience"],
  "actionableInsights": [
    "Consider reviewing the product pricing, as the user found it too high.",
    "Investigate the bug reported by the user to improve product stability.",
    "Follow up with the user to offer support and resolve their issues."
  ]
}

If you cannot generate meaningful insights, return an empty JSON object.`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
    });

    const insights = JSON.parse(aiResponse.choices[0].message.content || "{}");

    if (
      insights.sentiment &&
      insights.summary &&
      insights.keyThemes &&
      insights.actionableInsights
    ) {
      await ctx.runMutation(api.responses.updateResponse, {
        responseId,
        sentiment: insights.sentiment,
        summary: insights.summary,
        themes: insights.keyThemes,
        actionableInsights: insights.actionableInsights,
      });
    } else {
      await ctx.runMutation(api.responses.updateResponse, {
        responseId,
        notes: "Could not generate insights for this response.",
      });
    }
  },
});
