"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const redirectUri = `${process.env.CONVEX_URL}/notion`;

export const getOAuthUrl = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const notionClientId = process.env.NOTION_AUTH_CLIENT;
        if (!notionClientId) {
            throw new Error("Notion Client ID is not set in environment variables.");
        }

        const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
        authUrl.searchParams.set("client_id", notionClientId);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("owner", "user");
        authUrl.searchParams.set("redirect_uri", redirectUri);
        // Use the userId as the state to identify the user upon callback
        authUrl.searchParams.set("state", userId);

        return authUrl.toString();
    },
});

export const exchangeCode = action({
    args: { code: v.string(), userId: v.id("users") },
    handler: async (ctx, { code, userId }) => {
        const notionClientId = process.env.NOTION_AUTH_CLIENT;
        const notionClientSecret = process.env.NOTION_AUTH_SECRET;

        if (!notionClientId || !notionClientSecret) {
            throw new Error("Notion credentials not set in environment variables.");
        }

        const tokenUrl = "https://api.notion.com/v1/oauth/token";
        
        const basicAuth = btoa(`${notionClientId}:${notionClientSecret}`);

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Basic ${basicAuth}`
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Notion OAuth Error:", error);
            throw new Error(`Failed to exchange code for token: ${JSON.stringify(error)}`);
        }

        const tokenData = await response.json();

        await ctx.runMutation(internal.notionMutation.storeAccessToken, {
            userId,
            accessToken: tokenData.access_token,
            workspaceId: tokenData.workspace_id,
            workspaceName: tokenData.workspace_name,
            workspaceIcon: tokenData.workspace_icon,
            botId: tokenData.bot_id,
        });

        return "Successfully connected Notion Account!";
    },
});

export const getAccessibleDatabases = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const notionIntegration = await ctx.runQuery(api.integrations.getNotionIntegration);
        
        if (!notionIntegration || !notionIntegration.config.accessToken) {
            return [];
        }

        const response = await fetch("https://api.notion.com/v1/search", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${notionIntegration.config.accessToken}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filter: {
                    value: "database",
                    property: "object",
                },
                sort: {
                    direction: "ascending",
                    timestamp: "last_edited_time",
                },
            }),
        });

        if (!response.ok) {
            console.error("Failed to fetch Notion databases", await response.json());
            return [];
        }

        const data = await response.json();
        
        return data.results.map((db: any) => ({
            id: db.id,
            title: db.title[0]?.plain_text || "Untitled Database",
        }));
    },
});

export const getDatabaseProperties = action({
    args: { databaseId: v.string() },
    handler: async (ctx, { databaseId }): Promise<any> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const notionIntegration = await ctx.runQuery(api.integrations.getNotionIntegration);
        
        if (!notionIntegration || !notionIntegration.config.accessToken) {
            throw new Error("Notion integration not found or access token is missing.");
        }

        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${notionIntegration.config.accessToken}`,
                "Notion-Version": "2022-06-28",
            },
        });

        if (!response.ok) {
            console.error("Failed to fetch Notion database properties", await response.json());
            throw new Error("Failed to fetch Notion database properties.");
        }

        const data = await response.json();
        
        // Return a simplified list of properties { id, name, type }
        return Object.keys(data.properties).map((key) => ({
            id: data.properties[key].id,
            name: key,
            type: data.properties[key].type,
        }));
    },
});
