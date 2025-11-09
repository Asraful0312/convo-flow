"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const redirectUri = `${process.env.CONVEX_URL}/hubspot-callback`;

export const getOAuthUrl = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
        if (!hubspotClientId) {
            throw new Error("HubSpot Client ID is not set in environment variables.");
        }

        const authUrl = new URL("https://app.hubspot.com/oauth/authorize");
        authUrl.searchParams.set("client_id", hubspotClientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("scope", "crm.objects.contacts.read crm.objects.contacts.write oauth");
        authUrl.searchParams.set("state", userId);

        return authUrl.toString();
    },
});

export const exchangeCode = action({
    args: { code: v.string(), userId: v.id("users") },
    handler: async (ctx, { code, userId }) => {
        const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
        const hubspotClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

        if (!hubspotClientId || !hubspotClientSecret) {
            throw new Error("HubSpot credentials not set in environment variables.");
        }

        const tokenUrl = "https://api.hubapi.com/oauth/v1/token";
        
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: hubspotClientId,
                client_secret: hubspotClientSecret,
                redirect_uri: redirectUri,
                code: code,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("HubSpot OAuth Error:", error);
            throw new Error(`Failed to exchange code for token: ${JSON.stringify(error)}`);
        }

        const tokenData = await response.json();

        await ctx.runMutation(internal.hubspotMutation.storeTokens, {
            userId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
        });

        return "Successfully connected HubSpot Account!";
    },
});

export const refreshHubSpotToken = internalAction({
    args: {
        integrationId: v.id("integrations"),
        refreshToken: v.string(),
    },
    handler: async (ctx, { integrationId, refreshToken }) => {
        const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
        const hubspotClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

        if (!hubspotClientId || !hubspotClientSecret) {
            throw new Error("HubSpot credentials not set in environment variables.");
        }

        const tokenUrl = "https://api.hubapi.com/oauth/v1/token";

        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: hubspotClientId,
                client_secret: hubspotClientSecret,
                refresh_token: refreshToken,
            }),
        });

        if (!tokenResponse.ok) {
            console.error("Failed to refresh HubSpot access token.");
            throw new Error("Failed to refresh HubSpot access token.");
        }
        
        const newTokens = await tokenResponse.json();
        const integration = await ctx.runQuery(internal.integrations.get, { id: integrationId });

        if (integration) {
            await ctx.runMutation(internal.hubspotMutation.storeTokens, {
                userId: integration.userId,
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token ?? refreshToken,
                expiresIn: newTokens.expires_in,
            });
        }
        return newTokens.access_token;
    }
});
