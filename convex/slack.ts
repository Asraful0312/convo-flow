"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const redirectUri = `${process.env.CONVEX_URL}/slack-callback`;

export const getOAuthUrl = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const slackClientId = process.env.SLACK_CLIENT_ID;
        if (!slackClientId) {
            throw new Error("Slack Client ID is not set in environment variables.");
        }

        const authUrl = new URL("https://slack.com/oauth/v2/authorize");
        authUrl.searchParams.set("client_id", slackClientId);
        authUrl.searchParams.set("scope", "incoming-webhook");
        authUrl.searchParams.set("user_scope", ""); // Not requesting user-specific scopes
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("state", userId);

        return authUrl.toString();
    },
});

export const exchangeCode = action({
    args: { code: v.string(), userId: v.id("users") },
    handler: async (ctx, { code, userId }) => {
        const slackClientId = process.env.SLACK_CLIENT_ID;
        const slackClientSecret = process.env.SLACK_CLIENT_SECRET;

        if (!slackClientId || !slackClientSecret) {
            throw new Error("Slack credentials not set in environment variables.");
        }

        const tokenUrl = "https://slack.com/api/oauth.v2.access";
        
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: code,
                client_id: slackClientId,
                client_secret: slackClientSecret,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Slack OAuth Error:", error);
            throw new Error(`Failed to exchange code for token: ${error.error}`);
        }

        const tokenData = await response.json();

        if (!tokenData.ok || !tokenData.incoming_webhook) {
            console.error("Slack OAuth Success, but no webhook data:", tokenData);
            throw new Error(`Slack OAuth failed: ${tokenData.error || "No incoming webhook data received."}`);
        }

        const { url, channel, channel_id, configuration_url } = tokenData.incoming_webhook;

        await ctx.runMutation(internal.slackMutation.storeIncomingWebhook, {
            userId,
            url,
            channel,
            channelId: channel_id,
            configurationUrl: configuration_url,
        });

        return "Successfully connected Slack Account!";
    },
});
