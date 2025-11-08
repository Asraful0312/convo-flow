"use node";

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const redirectUri = `https://tremendous-curlew-325.convex.site/google-callback`;

console.log("Redirect URI used:", redirectUri);


export const getOAuthUrl = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const googleClientId = process.env.AUTH_GOOGLE_ID;
        if (!googleClientId) {
            throw new Error("Google Client ID is not set in environment variables.");
        }

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", googleClientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly");
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", userId);

        return authUrl.toString();
    },
});

export const exchangeCode = action({
    args: { code: v.string(), userId: v.id("users") },
    handler: async (ctx, { code, userId }) => {
        const googleClientId = process.env.AUTH_GOOGLE_ID;
        const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

        console.log("clinet id, secret", googleClientId, googleClientSecret)

        if (!googleClientId || !googleClientSecret) {
            throw new Error("Google credentials not set in environment variables.");
        }

        const tokenUrl = "https://oauth2.googleapis.com/token";
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                client_id: googleClientId,
                client_secret: googleClientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to exchange code for token: ${JSON.stringify(error)}`);
        }

        const { refresh_token } = await response.json();

        if (!refresh_token) {
            throw new Error("Refresh token not received from Google. Please ensure you are prompting for consent.");
        }

        await ctx.runMutation(internal.googleMutation.storeRefreshToken, {
            userId,
            refreshToken: refresh_token,
        });

        return "Successfully connected Google Account!";
    },
});

export const getAccessibleSheets = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated.");
        }

        const googleIntegration = await ctx.runQuery(api.integrations.getGoogleIntegration);
        
        if (!googleIntegration || !googleIntegration.config.refreshToken) {
            return [];
        }

        // 1. Exchange refresh token for access token
        const tokenUrl = "https://oauth2.googleapis.com/token";
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.AUTH_GOOGLE_ID,
                client_secret: process.env.AUTH_GOOGLE_SECRET,
                refresh_token: googleIntegration.config.refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            throw new Error(`Failed to refresh Google token: ${JSON.stringify(error)}`);
        }
        const { access_token } = await tokenResponse.json();

        // 2. List spreadsheets using the access token
        const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
        driveUrl.searchParams.set("q", "mimeType='application/vnd.google-apps.spreadsheet'");
        driveUrl.searchParams.set("fields", "files(id, name)");
        driveUrl.searchParams.set("orderBy", "modifiedTime desc");

        const driveResponse = await fetch(driveUrl.toString(), {
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
        });

        if (!driveResponse.ok) {
            const error = await driveResponse.json();
            console.error("Failed to fetch Google Sheets", error);
            return [];
        }

        const data = await driveResponse.json();
        return data.files.map((file: { id: string, name: string }) => ({
            id: file.id,
            title: file.name,
        }));
    },
});


