"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Main action to trigger all integrations for a response
export const sendToIntegrations = internalAction({
    args: { responseId: v.id("responses") },
    handler: async (ctx, { responseId }) => {
        const response = await ctx.runQuery(api.responses.getResponseWithAnswers, { responseId });
        if (!response) {
            console.error("Could not find response for integrations", { responseId });
            return;
        }

        const form = await ctx.runQuery(internal.forms.getFormForIntegrations, { formId: response.formId });
        if (!form) {
            console.error("Could not find form for integrations", { formId: response.formId });
            return;
        }
        
        const userIntegrations = await ctx.runQuery(internal.integrations.getIntegrationsForUser, { userId: form.userId });

        if (!userIntegrations || userIntegrations.length === 0) {
            return; // No integrations to process
        }

        const answersWithQuestions = response.answers.map(answer => {
            const question = form.questions.find(q => q._id === answer.questionId);
            return {
                ...answer,
                questionText: question?.text || "Unknown Question",
            };
        });

        for (const integration of userIntegrations) {
            if (!integration.enabled) continue;

            try {
                switch (integration.type) {
                    case "slack":
                        await sendToSlack(integration, form, response, answersWithQuestions);
                        break;
                    case "google_sheets":
                        await sendToGoogleSheets(integration, form, answersWithQuestions);
                        break;
                    case "notion":
                        await sendToNotion(integration, form, answersWithQuestions);
                        break;
                    case "zapier":
                        await sendToZapier(integration, form, response, answersWithQuestions);
                        break;
                    case "airtable":
                        // Placeholder for Airtable integration
                        console.log("Airtable integration triggered but not yet implemented.");
                        break;
                    // Other cases will be added here
                }
            } catch (error) {
                console.error(`Failed to send to integration ${integration.name}`, {
                    responseId,
                    integrationId: integration._id,
                    error: (error as Error).message,
                });
            }
        }
    },
});

// Helper function to send data to Slack
async function sendToSlack(
    integration: Doc<"integrations">,
    form: Doc<"forms"> & { questions: Doc<"questions">[] },
    response: Doc<"responses">,
    answers: (Doc<"answers"> & { questionText: string })[]
) {
    const webhookUrl = integration.config?.webhookUrl;
    if (!webhookUrl) {
        throw new Error("Slack webhook URL is not configured.");
    }

    const answerFields = answers.map(answer => {
        const question = form.questions.find(q => q._id === answer.questionId);
        let value = answer.value;
        if (question?.type === 'file' && answer.fileUrl) {
            value = `File: ${answer.fileName} (${(answer.fileSize! / 1024).toFixed(2)} KB)`;
        }
        return {
            type: "mrkdwn",
            text: `*${answer.questionText}*\n${value}`,
        };
    });

    const payload = {
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `🎉 New Response for \"${form.title}\" `,
                    emoji: true,
                },
            },
            {type: "section",
                fields: [
                    { type: "mrkdwn", text: `*Status:*\n${response.status}` },
                    { type: "mrkdwn", text: `*Submitted At:*\n${new Date(response.completedAt!).toLocaleString()}` },
                ],
            },
            { type: "divider" },
            ...answerFields.map(field => ({ type: "section", text: field })),
            { type: "divider" },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Response ID: ${response._id}`,
                    },
                ],
            },
        ],
    };

    const result = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`Slack API Error: ${result.status} ${errorText}`);
    }
}

async function sendToGoogleSheets(
    integration: Doc<"integrations">,
    form: Doc<"forms"> & { questions: Doc<"questions">[] },
    answers: (Doc<"answers"> & { questionText: string })[]
) {
    const { refreshToken, sheetId } = integration.config;
    if (!refreshToken || !sheetId) {
        throw new Error("Google Sheets refresh token or Sheet ID is not configured.");
    }

    // 1. Exchange refresh token for access token
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Failed to refresh Google token: ${JSON.stringify(error)}`);
    }
    const { access_token } = await tokenResponse.json();

    // 2. Append data to the sheet using the access token
    const orderedAnswers = form.questions.map(question => {
        const answer = answers.find(a => a.questionId === question._id);
        return answer ? answer.value : "";
    });

    const range = "A1";
    const valueInputOption = "USER_ENTERED";
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=${valueInputOption}`;

    const sheetResponse = await fetch(sheetUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [orderedAnswers] }),
    });

    if (!sheetResponse.ok) {
        const errorData = await sheetResponse.json();
        console.error("Google Sheets API Error:", errorData);
        throw new Error(`Google Sheets API Error: ${errorData.error.message}`);
    }
}

async function sendToNotion(
    integration: Doc<"integrations">,
    form: Doc<"forms"> & { questions: Doc<"questions">[] },
    answers: (Doc<"answers"> & { questionText: string })[]
) {
    const apiKey = integration.config?.apiKey;
    const databaseId = integration.config?.databaseId;

    if (!apiKey || !databaseId) {
        throw new Error("Notion API Key or Database ID is not configured.");
    }

    // First, fetch the database schema to see available properties
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
        },
    });

    if (!dbResponse.ok) {
        throw new Error("Failed to fetch Notion database schema");
    }

    const dbData = await dbResponse.json();
    const availableProperties = Object.keys(dbData.properties);

    const properties: { [key: string]: any } = {};
    
    // Find title property (required)
    const titleProp = Object.entries(dbData.properties).find(
        ([_, prop]: [string, any]) => prop.type === 'title'
    );
    
    if (titleProp) {
        const titleAnswer = answers[0] || { value: `Response ${Date.now()}` };
        properties[titleProp[0]] = {
            title: [
                {
                    text: {
                        content: titleAnswer.value.toString().substring(0, 2000),
                    },
                },
            ],
        };
    }

    // Match other answers to available properties
    answers.forEach((answer, index) => {
        if (index === 0 && titleProp) return; // Skip if used as title
        
        // Try to find matching property (case-insensitive)
        const matchingProp = availableProperties.find(
            prop => prop.toLowerCase() === answer.questionText.toLowerCase()
        );

        if (matchingProp && matchingProp !== titleProp?.[0]) {
            const propType = dbData.properties[matchingProp].type;
            const value = answer.value?.toString() || "";

            // Handle different Notion property types
            switch (propType) {
                case 'rich_text':
                    properties[matchingProp] = {
                        rich_text: [{ text: { content: value.substring(0, 2000) } }],
                    };
                    break;
                case 'email':
                    properties[matchingProp] = { email: value };
                    break;
                case 'phone_number':
                    properties[matchingProp] = { phone_number: value };
                    break;
                case 'number':
                    properties[matchingProp] = { number: parseFloat(value) || 0 };
                    break;
                case 'select':
                    properties[matchingProp] = { select: { name: value } };
                    break;
                case 'url':
                    properties[matchingProp] = { url: value };
                    break;
                default:
                    properties[matchingProp] = {
                        rich_text: [{ text: { content: value.substring(0, 2000) } }],
                    };
            }
        }
    });

    const payload = {
        parent: { database_id: databaseId },
        properties: properties,
    };

    const result = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(payload),
    });

    if (!result.ok) {
        const errorData = await result.json();
        console.error("Notion API Error:", errorData);
        throw new Error(`Notion API Error: ${errorData.message}`);
    }
}

async function sendToZapier(
    integration: Doc<"integrations">,
    form: Doc<"forms">,
    response: Doc<"responses">,
    answers: (Doc<"answers"> & { questionText: string })[]
) {
    const webhookUrl = integration.config?.webhookUrl;
    if (!webhookUrl) {
        throw new Error("Zapier webhook URL is not configured.");
    }

    const payload: { [key: string]: any } = {
        formId: form._id,
        formTitle: form.title,
        responseId: response._id,
        submittedAt: new Date(response.completedAt!).toISOString(),
    };

    answers.forEach(answer => {
        const key = answer.questionText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        payload[`answer_${key}`] = answer.value;
    });

    const result = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`Zapier Webhook Error: ${result.status} ${errorText}`);
    }
}

