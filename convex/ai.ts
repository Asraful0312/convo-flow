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
        userName: v.optional(v.string()),
        previousAnswer: v.optional(v.string()),
    },
    handler: async (ctx, { question, history, personality, userName, previousAnswer }) => {
        const personalityPrompt = {
            professional: "You are a professional assistant. Your tone is courteous and clear.",
            friendly: "You are a friendly assistant. Your tone is warm and encouraging.",
            casual: "You are a casual assistant. Your tone is relaxed and conversational.",
            formal: "You are a formal assistant. Your tone is respectful and precise.",
        }[personality || 'friendly'] || "You are a helpful assistant.";

        const messages: any[] = [
            { role: "system", content: `${personalityPrompt} You are a conversational form assistant. Your primary goal is to make filling out this form feel less like a chore and more like a friendly chat.
Your task is to rephrase the upcoming form question to make it more natural and engaging.

${userName ? `The user's name is ${userName}. Feel free to use it to make the conversation more personal, but don't overdo it.` : ''}

Here's how to do it:
- Look at the conversation history to understand the flow.
- ${previousAnswer ? `The user's previous answer was "${previousAnswer}". Acknowledge it briefly and naturally before asking the next question. For example: "Thanks for sharing that, ${userName || ''}!" or "Got it. Next up...".` : ''}
- Rephrase the question naturally. Instead of "Email", say "What's the best email address to reach you at?".
- Adapt your rephrasing based on the given personality.
- Keep it concise.
- **Crucially, only return the rephrased question text. No extra greetings, no chitchat outside of the question itself.**

The goal is a smooth, engaging conversation that gets the form filled out.` },
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
                content: `${personalityPrompt} You are validating a user's answer on a form with a touch of humor and personality.
                The user has provided an answer to a question.
                Determine if the answer is valid and makes sense for the question.

                - If the answer is valid, return: {"isValid": true}
                - If the answer is nonsensical, gibberish, clearly incorrect, or just plain weird for the question, return: {"isValid": false, "reason": "A polite, conversational, and slightly funny/witty message explaining why the answer is invalid and asking for a better one."}

                Be creative! Your goal is to keep the user engaged, not just to validate data.

                Example 1:
                Question: "What is your full name?"
                Answer: "blablabla"
                Response: {"isValid": false, "reason": "That's a very... unique name! Are you a secret agent? 😉 Could you please provide your actual name?"}

                Example 2:
                Question: "What is your email address?"
                Answer: "not telling you"
                Response: {"isValid": false, "reason": "I respect your privacy, but I kinda need your email to proceed. Pretty please? 😊"}

                Example 3:
                Question: "What's your favorite color?"
                Answer: "the sound of rain"
                Response: {"isValid": false, "reason": "While 'the sound of rain' is a beautiful thought, it's not exactly a color I can put in my crayon box. How about a color like blue or green?"}

                Example 4:
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
