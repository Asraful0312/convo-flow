"use node";

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

const redirectUri = `http://tremendous-curlew-325.convex.site/google-callback`;

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
        authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/spreadsheets");
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


