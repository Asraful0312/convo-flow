"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

const redirectUri = `${process.env.CONVEX_URL}/salesforce-callback`;

function base64URLEncode(str: Buffer) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function sha256(buffer: string) {
    return crypto.createHash('sha256').update(buffer).digest();
}

export const getOAuthUrl = action({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const salesforceClientId = process.env.SALESFORCE_CLIENT_ID;
    if (!salesforceClientId) {
      throw new Error("Salesforce Client ID is not set in environment variables.");
    }

    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    await ctx.runMutation(internal.salesforceMutation.storeCodeVerifier, {
        userId,
        codeVerifier,
    });

    const authUrl = new URL(
      `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/authorize`
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", salesforceClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", userId);
    authUrl.searchParams.set("scope", "api refresh_token");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return authUrl.toString();
  },
});

export const exchangeCode = action({
  args: { code: v.string(), userId: v.id("users") },
  handler: async (ctx, { code, userId }) => {
    const salesforceClientId = process.env.SALESFORCE_CLIENT_ID;
    const salesforceClientSecret = process.env.SALESFORCE_CLIENT_SECRET;

    if (!salesforceClientId || !salesforceClientSecret) {
      throw new Error("Salesforce credentials not set in environment variables.");
    }

    const tempVerifier = await ctx.runQuery(internal.salesforceMutation.getCodeVerifier, { userId });
    if (!tempVerifier) {
        throw new Error("OAuth flow expired or invalid. Please try again.");
    }

    const tokenUrl = new URL(
      `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`
    );

    const response = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: salesforceClientId,
        client_secret: salesforceClientSecret,
        redirect_uri: redirectUri,
        code_verifier: tempVerifier.codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Salesforce OAuth Error:", error);
      throw new Error(
        `Failed to exchange code for token: ${error.error_description}`
      );
    }

    const tokenData = await response.json();

    await ctx.runMutation(internal.salesforceMutation.storeTokens, {
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      instanceUrl: tokenData.instance_url,
    });

    await ctx.runMutation(internal.salesforceMutation.deleteCodeVerifier, { verifierId: tempVerifier._id });

    return "Successfully connected Salesforce Account!";
  },
});

export const refreshSalesforceToken = internalAction({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, { refreshToken }) => {
    const salesforceClientId = process.env.SALESFORCE_CLIENT_ID;
    const salesforceClientSecret = process.env.SALESFORCE_CLIENT_SECRET;

    if (!salesforceClientId || !salesforceClientSecret) {
      throw new Error("Salesforce credentials not set in environment variables.");
    }

    const tokenUrl = new URL(
      `${process.env.SALESFORCE_INSTANCE_URL}/services/oauth2/token`
    );

    const response = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: salesforceClientId,
        client_secret: salesforceClientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to refresh Salesforce token:", error);
      throw new Error("Failed to refresh Salesforce token.");
    }

    const newTokens = await response.json();
    return {
      accessToken: newTokens.access_token,
      instanceUrl: newTokens.instance_url,
    };
  },
});
