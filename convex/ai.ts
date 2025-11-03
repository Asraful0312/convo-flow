import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI();

export const generateForm = action({
    args: {
        prompt: v.string(),
        conversationHistory: v.optional(v.array(v.object({ role: v.union(v.literal("user"), v.literal("ai")), content: v.string() }))),
    },
    handler: async (ctx, { prompt, conversationHistory }) => {
        const userMessage = `Generate a form based on this prompt: ${prompt}`;
        const messages: any[] = [
            { role: "system", content: "You are a form generation assistant. Create a JSON structure for a form with title, description, and questions. Each question should have text, type (e.g., text, textarea, email, number, choice, multiple_choice, rating, date, file), and a required flag. For choice-based questions, provide options." },
            ...(conversationHistory || []).map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content })),
            { role: "user", content: userMessage },
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            response_format: { type: "json_object" },
        });

        const formJson = response.choices[0].message.content;
        return JSON.parse(formJson || "{}");
    },
});

export const getConversationalQuestion = action({
    args: {
        question: v.string(),
        history: v.array(v.object({ role: v.union(v.literal("user"), v.literal("ai")), content: v.string() })),
        personality: v.optional(v.string()),
    },
    handler: async (ctx, { question, history, personality }) => {
        const personalityPrompt = {
            professional: "You are a professional assistant. Your tone is courteous and clear.",
            friendly: "You are a friendly assistant. Your tone is warm and encouraging.",
            casual: "You are a casual assistant. Your tone is relaxed and conversational.",
            formal: "You are a formal assistant. Your tone is respectful and precise.",
        }[personality || 'friendly'] || "You are a helpful assistant.";

        const messages: any[] = [
            { role: "system", content: `${personalityPrompt} You are a conversational form assistant. Your task is to rephrase the given form question to make it more natural and engaging in the context of the conversation history.
            - If the question is simple like "Name", you can ask "What is your name?" or "May I have your name?".
            - Adapt your rephrasing based on the personality.
            - Only return the rephrased question text, nothing else. No greetings, no extra sentences.` },
            ...history.map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content })),
            { role: "user", content: `Rephrase: "${question}"` },
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
        const personalityPrompt = {
            professional: "You are a professional assistant.",
            friendly: "You are a friendly assistant.",
            casual: "You are a casual assistant.",
            formal: "You are a formal assistant.",
        }[personality] || "You are a helpful assistant.";

        const messages: any[] = [
            {
                role: "system",
                content: `${personalityPrompt} You are validating a user's answer on a form.
                The user has provided an answer to a question.
                Determine if the answer is valid and makes sense for the question.
                - If the answer is valid, return: {"isValid": true}
                - If the answer is nonsensical, gibberish, or clearly incorrect for the question, return: {"isValid": false, "reason": "A polite, conversational message explaining why the answer is invalid and asking for a better one."}

                Example 1:
                Question: "What is your full name?"
                Answer: "blablabla"
                Response: {"isValid": false, "reason": "That doesn't seem to be a valid name. Could you please provide your name?"}

                Example 2:
                Question: "What is your email address?"
                Answer: "test"
                Response: {"isValid": false, "reason": "This doesn't look like a valid email address. Please enter a valid email."}

                Example 3:
                Question: "What is your name?"
                Answer: "John Doe"
                Response: {"isValid": true}

                Your response must be a JSON object.`
            },
            { role: "user", content: `Question: "${question}"
Answer: "${answer}"` },
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            response_format: { type: "json_object" },
        });

        const validationResult = JSON.parse(response.choices[0].message.content || "{}");
        return validationResult;
    },
});

export const generateInsights = internalAction({
    args: { responseId: v.id("responses") },
    handler: async (ctx, { responseId }) => {
        const responseData = await ctx.runQuery(api.responses.getResponseWithAnswers, { responseId });
        if (!responseData) return;

        const answersText = responseData.answers.map(a => `Q: ${a.questionId}\nA: ${a.value}`).join('\n\n');

        const prompt = `Analyze the following form response and provide insights. Response:\n${answersText}\n\nProvide sentiment (Positive, Negative, Neutral), key themes (array of strings), and a concise summary. Return as JSON.`;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" },
        });

        const insights = JSON.parse(aiResponse.choices[0].message.content || "{}");

        if (insights.sentiment && insights.summary && insights["key themes"]) {
            await ctx.runMutation(api.responses.updateResponse, {
                responseId,
                sentiment: insights.sentiment,
                summary: insights.summary,
                themes: insights["key themes"],
            });
        } else {
            await ctx.runMutation(api.responses.updateResponse, {
                responseId,
                notes: "Could not generate insights for this response.",
            });
        }
    },
});
