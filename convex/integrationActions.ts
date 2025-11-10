"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const sendToIntegrations = internalAction({
  args: { responseId: v.id("responses") },
  handler: async (ctx, { responseId }) => {
    const response = await ctx.runQuery(api.responses.getResponseWithAnswers, {
      responseId,
    });
    if (!response) {
      console.error("Could not find response for integrations", { responseId });
      return;
    }

    const form = await ctx.runQuery(internal.forms.getFormForIntegrations, {
      formId: response.formId,
    });
    if (!form) {
      console.error("Could not find form for integrations", {
        formId: response.formId,
      });
      return;
    }

    const userIntegrations = await ctx.runQuery(
      internal.integrations.getIntegrationsForUser,
      { userId: form.userId },
    );

    if (!userIntegrations || userIntegrations.length === 0) {
      return; // No integrations to process
    }

    const answersWithQuestions = response.answers.map((answer) => {
      const question = form.questions.find(
        (q: any) => q._id === answer.questionId,
      );
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
            await sendToSlack(
              integration,
              form,
              response,
              answersWithQuestions,
            );
            break;
          case "google_sheets":
            await sendToGoogleSheets(integration, form, answersWithQuestions);
            break;
          case "notion":
            await sendToNotion(integration, form, answersWithQuestions);
            break;
          case "airtable":
            await sendToAirtable(ctx, integration, form, answersWithQuestions);
            break;
          case "zapier":
            await sendToZapier(
              integration,
              form,
              response,
              answersWithQuestions,
            );
            break;
          case "hubspot":
            await sendToHubSpot(ctx, integration, form, answersWithQuestions);
            break;
          case "email":
            await ctx.runAction(internal.email.send, {
                integration,
                form,
                response,
                answers: answersWithQuestions,
            });
            break;
          case "salesforce":
            await sendToSalesforce(ctx, integration, form, answersWithQuestions);
            break;
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

async function sendToSalesforce(
    ctx: any,
    integration: Doc<"integrations">,
    form: Doc<"forms"> & { questions: Doc<"questions">[] },
    answers: (Doc<"answers"> & { questionText: string })[]
) {
    const jsforce = await import("jsforce");
    const { accessToken, refreshToken, instanceUrl } = integration.config;

    if (!accessToken || !refreshToken || !instanceUrl) {
        throw new Error("Salesforce configuration is incomplete.");
    }

    const conn = new jsforce.Connection({
        instanceUrl,
        accessToken,
        refreshToken,
        oauth2: {
            clientId: process.env.SALESFORCE_CLIENT_ID!,
            clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
            redirectUri: `${process.env.CONVEX_URL}/salesforce-callback`,
        },
    });

    const salesforceLead: { [key: string]: any } = {};
    answers.forEach(answer => {
        const qText = answer.questionText.toLowerCase();
        if (qText.includes('company')) {
            salesforceLead['Company'] = answer.value;
        } else if (qText.includes('last name')) {
            salesforceLead['LastName'] = answer.value;
        } else if (qText.includes('first name')) {
            salesforceLead['FirstName'] = answer.value;
        } else if (qText.includes('email')) {
            salesforceLead['Email'] = answer.value;
        } else if (qText.includes('phone')) {
            salesforceLead['Phone'] = answer.value;
        } else if (qText.includes('name')) {
            const nameParts = answer.value.toString().split(' ');
            salesforceLead['FirstName'] = nameParts[0];
            if (nameParts.length > 1) {
                salesforceLead['LastName'] = nameParts.slice(1).join(' ');
            }
        }
    });

    if (!salesforceLead.Company || !salesforceLead.LastName) {
        throw new Error("To create a Salesforce Lead, 'Company' and 'Last Name' fields are required.");
    }

    try {
        await conn.sobject("Lead").create(salesforceLead);
    } catch (err: any) {
        console.error("Salesforce API Error:", err.message);
        throw new Error(`Salesforce API Error: ${err.message}`);
    }
}

// Helper function to send data to Slack
async function sendToSlack(
  integration: Doc<"integrations">,
  form: Doc<"forms"> & { questions: Doc<"questions">[] },
  response: Doc<"responses">,
  answers: (Doc<"answers"> & { questionText: string })[],
) {
  const webhookUrl = integration.config?.incomingWebhook?.url;
  if (!webhookUrl) {
    throw new Error("Slack webhook URL is not configured.");
  }

  const answerFields = answers.map((answer) => {
    const question = form.questions.find((q) => q._id === answer.questionId);
    let value = answer.value;
    if (question?.type === "file" && answer.fileUrl) {
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
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Status:*\n${response.status}` },
          {
            type: "mrkdwn",
            text: `*Submitted At:*\n${new Date(response.completedAt!).toLocaleString()}`,
          },
        ],
      },
      { type: "divider" },
      ...answerFields.map((field) => ({ type: "section", text: field })),
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

async function sendToAirtable(
  ctx: any,
  integration: Doc<"integrations">,
  form: Doc<"forms"> & { questions: Doc<"questions">[] },
  answers: (Doc<"answers"> & { questionText: string })[],
) {
  let { accessToken, refreshToken, expiresAt, baseId, tableId } =
    integration.config;

  if (!accessToken || !refreshToken || !expiresAt || !baseId || !tableId) {
    throw new Error(
      "Airtable configuration is incomplete. Missing tokens, Base ID, or Table ID.",
    );
  }

  // Refresh token if it's about to expire (e.g., within the next 5 minutes)
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    accessToken = await ctx.runAction(internal.airtable.refreshAirtableToken, {
      integrationId: integration._id,
      refreshToken: refreshToken,
    });
  }

  const fields: { [key: string]: any } = {};
  answers.forEach((answer) => {
    fields[answer.questionText] = answer.value;
  });

  const airtableApiUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const result = await fetch(airtableApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [{ fields }],
    }),
  });

  if (!result.ok) {
    const errorData = await result.json();
    console.error("Airtable API Error:", errorData);
    throw new Error(`Airtable API Error: ${JSON.stringify(errorData.error)}`);
  }
}

async function sendToGoogleSheets(
  integration: Doc<"integrations">,
  form: Doc<"forms"> & { questions: Doc<"questions">[] },
  answers: (Doc<"answers"> & { questionText: string })[],
) {
  const { refreshToken, sheetId } = integration.config;
  if (!refreshToken || !sheetId) {
    throw new Error(
      "Google Sheets refresh token or Sheet ID is not configured.",
    );
  }

  // 1. Exchange refresh token for access token
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH_GOOGLE_ID,
      client_secret: process.env.AUTH_GOOGLE_SECRET,
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
  const orderedAnswers = form.questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question._id);
    return answer ? answer.value : "";
  });

  const range = "A1";
  const valueInputOption = "USER_ENTERED";
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=${valueInputOption}`;

  const sheetResponse = await fetch(sheetUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
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
  answers: (Doc<"answers"> & { questionText: string })[],
) {
  const accessToken = integration.config?.accessToken;
  if (!accessToken) {
    throw new Error("Notion Access Token is not configured.");
  }

  // Prioritize database ID from form-specific mapping, then fall back to global integration config
  const databaseId =
    form.integrationMappings?.notion?.databaseId ??
    integration.config?.databaseId;
  if (!databaseId) {
    throw new Error(
      "Notion Database ID is not configured in form mappings or global settings.",
    );
  }

  // Fetch database schema
  const dbResponse = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
      },
    },
  );
  if (!dbResponse.ok) {
    console.error(
      "Failed to fetch Notion database schema",
      await dbResponse.json(),
    );
    throw new Error(
      "Failed to fetch Notion database schema. Make sure the integration has access to the database.",
    );
  }
  const dbData = await dbResponse.json();
  const notionProperties = dbData.properties;
  const titlePropName = Object.keys(notionProperties).find(
    (key) => notionProperties[key].type === "title",
  );
  if (!titlePropName) {
    throw new Error(
      "Could not find a 'Title' property in the Notion database.",
    );
  }

  const properties: { [key: string]: any } = {};
  const explicitMappings = form.integrationMappings?.notion?.mapping;

  // STRATEGY 1: Use explicit mapping if it exists
  if (explicitMappings && explicitMappings.length > 0) {
    // Handle title property from explicit mapping
    const titleMapping = explicitMappings.find(
      (m) => m.notionPropertyName === titlePropName,
    );
    let titleAnswerValue: string | undefined;
    if (titleMapping) {
      const titleAnswer = answers.find(
        (a) => a.questionId === titleMapping.questionId,
      );
      titleAnswerValue = titleAnswer?.value?.toString();
    }
    // Fallback for title if not explicitly mapped
    if (!titleAnswerValue) {
      const firstQuestion = form.questions.sort((a, b) => a.order - b.order)[0];
      const firstAnswer = answers.find(
        (a) => a.questionId === firstQuestion?._id,
      );
      titleAnswerValue =
        firstAnswer?.value?.toString() ??
        `Response from ${new Date().toLocaleString()}`;
    }
    properties[titlePropName] = {
      title: [{ text: { content: titleAnswerValue?.substring(0, 2000) } }],
    };

    // Handle other properties from explicit mapping
    explicitMappings.forEach((map) => {
      if (map.notionPropertyName === titlePropName) return;
      const answer = answers.find((a) => a.questionId === map.questionId);
      if (answer?.value !== null && answer?.value !== undefined) {
        const formattedProp = formatNotionProperty(
          notionProperties,
          map.notionPropertyName,
          answer.value,
        );
        if (formattedProp) properties[map.notionPropertyName] = formattedProp;
      }
    });

    // STRATEGY 2: Fallback to name-matching if no explicit mapping exists
  } else {
    // Handle title property (first question)
    const firstQuestion = form.questions.sort((a, b) => a.order - b.order)[0];
    const titleAnswer = answers.find(
      (a) => a.questionId === firstQuestion?._id,
    );
    properties[titlePropName] = {
      title: [
        {
          text: {
            content: (
              titleAnswer?.value?.toString() ??
              `Response from ${new Date().toLocaleString()}`
            ).substring(0, 2000),
          },
        },
      ],
    };

    // Handle other properties by matching names
    answers.forEach((answer) => {
      if (answer.questionId === firstQuestion?._id) return; // Skip title answer
      const matchingPropName = Object.keys(notionProperties).find(
        (propName) =>
          propName.toLowerCase() === answer.questionText.toLowerCase(),
      );
      if (matchingPropName && matchingPropName !== titlePropName) {
        if (answer?.value !== null && answer?.value !== undefined) {
          const formattedProp = formatNotionProperty(
            notionProperties,
            matchingPropName,
            answer.value,
          );
          if (formattedProp) properties[matchingPropName] = formattedProp;
        }
      }
    });
  }

  // Send data to Notion
  await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  }).then(async (result) => {
    if (!result.ok) {
      const errorData = await result.json();
      console.error("Notion API Error:", errorData);
      throw new Error(`Notion API Error: ${errorData.message}`);
    }
  });
}

// Helper to format Notion properties to avoid code duplication
function formatNotionProperty(
  notionProperties: any,
  propName: string,
  value: any,
) {
  const propDetails = notionProperties[propName];
  if (!propDetails) return null;

  try {
    switch (propDetails.type) {
      case "rich_text":
        return {
          rich_text: [
            { text: { content: value.toString().substring(0, 2000) } },
          ],
        };
      case "number":
        const num = parseFloat(value);
        return !isNaN(num) ? { number: num } : null;
      case "select":
        return typeof value === "string" ? { select: { name: value } } : null;
      case "multi_select":
        if (Array.isArray(value))
          return { multi_select: value.map((v) => ({ name: v.toString() })) };
        if (typeof value === "string")
          return {
            multi_select: value.split(",").map((v) => ({ name: v.trim() })),
          };
        return null;
      case "date":
        try {
          return { date: { start: new Date(value).toISOString() } };
        } catch {
          return null;
        }
      case "email":
        return typeof value === "string" ? { email: value } : null;
      case "phone_number":
        return typeof value === "string" ? { phone_number: value } : null;
      case "url":
        return typeof value === "string" ? { url: value } : null;
      case "checkbox":
        return { checkbox: !!value };
      default:
        return null; // Ignore unsupported types
    }
  } catch (e) {
    console.error(`Failed to format property ${propName} with value`, value, e);
    return null;
  }
}

async function sendToZapier(
  integration: Doc<"integrations">,
  form: Doc<"forms">,
  response: Doc<"responses">,
  answers: (Doc<"answers"> & { questionText: string })[],
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

  answers.forEach((answer) => {
    const key = answer.questionText
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "_");
    payload[`answer_${key}`] = answer.value;
  });

  console.log("zapier payload", payload);

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

async function sendToHubSpot(
  ctx: any,
  integration: Doc<"integrations">,
  form: Doc<"forms"> & { questions: Doc<"questions">[] },
  answers: (Doc<"answers"> & { questionText: string })[],
) {
  let { accessToken, refreshToken, expiresAt } = integration.config;

  if (!accessToken || !refreshToken || !expiresAt) {
    throw new Error("HubSpot configuration is incomplete.");
  }

  // Refresh token if it's about to expire
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    accessToken = await ctx.runAction(internal.hubspot.refreshHubSpotToken, {
      integrationId: integration._id,
      refreshToken: refreshToken,
    });
  }

  const hubspotProperties: { [key: string]: any } = {};

  // Simple mapping from question text to HubSpot properties
  answers.forEach((answer) => {
    const qText = answer.questionText.toLowerCase();
    if (qText.includes("email")) {
      hubspotProperties["email"] = answer.value;
    } else if (qText.includes("first name")) {
      hubspotProperties["firstname"] = answer.value;
    } else if (qText.includes("last name")) {
      hubspotProperties["lastname"] = answer.value;
    } else if (qText.includes("phone")) {
      hubspotProperties["phone"] = answer.value;
    } else if (qText.includes("company")) {
      hubspotProperties["company"] = answer.value;
    } else if (qText.includes("name")) {
      // Simple name splitting
      const nameParts = answer.value.toString().split(" ");
      hubspotProperties["firstname"] = nameParts[0];
      if (nameParts.length > 1) {
        hubspotProperties["lastname"] = nameParts.slice(1).join(" ");
      }
    }
  });

  // A contact needs an email to be useful
  if (!hubspotProperties.email) {
    console.log(
      "No email found in response, skipping HubSpot contact creation.",
    );
    return;
  }

  const apiUrl = `https://api.hubapi.com/crm/v3/objects/contacts`;
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: hubspotProperties }),
  });

  if (!result.ok) {
    // If contact already exists (409 Conflict), we could update it, but for now we'll just log it.
    const errorData = await result.json();
    if (result.status === 409) {
      console.log("Contact likely already exists in HubSpot.", errorData);
      // Optionally, could add logic here to update the existing contact.
    } else {
      console.error("HubSpot API Error:", errorData);
      throw new Error(`HubSpot API Error: ${JSON.stringify(errorData)}`);
    }
  }
}
