"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

const redirectUri = `${process.env.CONVEX_URL}/airtable-callback`;

// Helper to generate a random string for the code verifier
function base64URLEncode(str: Buffer) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Helper to create the code challenge from the verifier
function sha256(buffer: string) {
    return crypto.createHash('sha256').update(buffer).digest();
}

export const getOAuthUrl = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const airtableClientId = process.env.AIRTABLE_CLIENT_ID;
        if (!airtableClientId) {
            throw new Error("Airtable Client ID is not set in environment variables.");
        }

        // PKCE Flow
        const codeVerifier = base64URLEncode(crypto.randomBytes(32));
        const codeChallenge = base64URLEncode(sha256(codeVerifier));
        
        // Store the verifier temporarily to use in the callback
        await ctx.runMutation(internal.airtableMutation.storeCodeVerifier, {
            userId,
            codeVerifier,
        });

        const authUrl = new URL("https://airtable.com/oauth2/v1/authorize");
        authUrl.searchParams.set("client_id", airtableClientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "data.records:read data.records:write schema.bases:read");
        authUrl.searchParams.set("state", userId);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        return authUrl.toString();
    },
});

export const exchangeCode = action({
    args: { code: v.string(), userId: v.id("users") },
    handler: async (ctx, { code, userId }) => {
        const airtableClientId = process.env.AIRTABLE_CLIENT_ID;
        const airtableClientSecret = process.env.AIRTABLE_CLIENT_SECRET;
        if (!airtableClientId || !airtableClientSecret) {
            throw new Error("Airtable Client ID or Secret is not set.");
        }

        const tempVerifier = await ctx.runQuery(internal.airtableMutation.getCodeVerifier, { userId });
        if (!tempVerifier) {
            throw new Error("OAuth flow expired or invalid. Please try again.");
        }

        const tokenUrl = "https://airtable.com/oauth2/v1/token";
        
        const basicAuth = Buffer.from(`${airtableClientId}:${airtableClientSecret}`).toString('base64');

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: redirectUri,
                code_verifier: tempVerifier.codeVerifier,
                grant_type: "authorization_code",
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Airtable OAuth Error:", error);
            throw new Error(`Failed to exchange code for token: ${JSON.stringify(error)}`);
        }

        const tokenData = await response.json();

        await ctx.runMutation(internal.airtableMutation.storeTokens, {
            userId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
        });

        // Clean up the temporary verifier
        await ctx.runMutation(internal.airtableMutation.deleteCodeVerifier, { verifierId: tempVerifier._id });

        return "Successfully connected Airtable Account!";
    },
});

export const refreshAirtableToken = internalAction({
    args: {
        integrationId: v.id("integrations"),
        refreshToken: v.string(),
    },
    handler: async (ctx, { integrationId, refreshToken }) => {
        const airtableClientId = process.env.AIRTABLE_CLIENT_ID;
        const airtableClientSecret = process.env.AIRTABLE_CLIENT_SECRET;
        if (!airtableClientId || !airtableClientSecret) {
            throw new Error("Airtable Client ID or Secret is not set.");
        }
        
        const basicAuth = Buffer.from(`${airtableClientId}:${airtableClientSecret}`).toString('base64');

        const tokenResponse = await fetch("https://airtable.com/oauth2/v1/token", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!tokenResponse.ok) {
            // If refresh fails, we might need to mark the integration as disconnected
            console.error("Failed to refresh Airtable access token.");
            throw new Error("Failed to refresh Airtable access token.");
        }
        
        const newTokens = await tokenResponse.json();
        const integration = await ctx.runQuery(internal.integrations.get, { id: integrationId });

        if (integration) {
            await ctx.runMutation(internal.airtableMutation.storeTokens, {
                userId: integration.userId,
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token ?? refreshToken, // Use new refresh token if provided
                expiresIn: newTokens.expires_in,
            });
        }
        return newTokens.access_token;
    }
});
