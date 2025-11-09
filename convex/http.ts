import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

const stripeWebhook = httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature") as string;
    const payload = await request.text();
  
    try {
      await ctx.runAction(internal.stripe.fulfill, { signature, payload });
      return new Response(null, { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response("Webhook Error", { status: 400 });
    }
});

const googleCallback = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
        return new Response("Missing code or state from Google OAuth callback", { status: 400 });
    }

    try {
        await ctx.runAction(api.google.exchangeCode, { code, userId: userId as any });
        const redirectUrl = `${process.env.SITE_URL}/dashboard/settings?selected=integrations`;
        return new Response(null, {
            status: 302, // Found (redirect)
            headers: { "Location": redirectUrl.toString() },
        });
    } catch (err) {
        console.error("Failed to handle Google OAuth callback", err);
        return new Response("Failed to connect Google Account", { status: 500 });
    }
});

const notionCallback = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
        return new Response("Missing code or state from Notion OAuth callback", { status: 400 });
    }

    try {
        await ctx.runAction(api.notion.exchangeCode, { code, userId: userId as any });
        const redirectUrl = `${process.env.SITE_URL}/dashboard/settings?selected=integrations`;
        return new Response(null, {
            status: 302, // Found (redirect)
            headers: { "Location": redirectUrl.toString() },
        });
    } catch (err) {
        console.error("Failed to handle Notion OAuth callback", err);
        return new Response("Failed to connect Notion Account", { status: 500 });
    }
});

http.route({
    path: "/stripe",
    method: "POST",
    handler: stripeWebhook,
});

http.route({
    path: "/google-callback",
    method: "GET",
    handler: googleCallback,
});

http.route({
    path: "/notion",
    method: "GET",
    handler: notionCallback,
});

const slackCallback = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
        return new Response("Missing code or state from Slack OAuth callback", { status: 400 });
    }

    try {
        await ctx.runAction(api.slack.exchangeCode, { code, userId: userId as any });
        const redirectUrl = `${process.env.SITE_URL}/dashboard/settings?selected=integrations`;
        return new Response(null, {
            status: 302, // Found (redirect)
            headers: { "Location": redirectUrl.toString() },
        });
    } catch (err) {
        console.error("Failed to handle Slack OAuth callback", err);
        return new Response("Failed to connect Slack Account", { status: 500 });
    }
});

http.route({
    path: "/slack-callback",
    method: "GET",
    handler: slackCallback,
});

const airtableCallback = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
        return new Response("Missing code or state from Airtable OAuth callback", { status: 400 });
    }

    try {
        await ctx.runAction(api.airtable.exchangeCode, { code, userId: userId as any });
        const redirectUrl = `${process.env.SITE_URL}/dashboard/settings?selected=integrations`;
        return new Response(null, {
            status: 302, // Found (redirect)
            headers: { "Location": redirectUrl.toString() },
        });
    } catch (err) {
        console.error("Failed to handle Airtable OAuth callback", err);
        return new Response("Failed to connect Airtable Account", { status: 500 });
    }
});

http.route({
    path: "/airtable-callback",
    method: "GET",
    handler: airtableCallback,
});

const hubspotCallback = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const userId = url.searchParams.get("state");

    if (!code || !userId) {
        return new Response("Missing code or state from HubSpot OAuth callback", { status: 400 });
    }

    try {
        await ctx.runAction(api.hubspot.exchangeCode, { code, userId: userId as any });
        const redirectUrl = `${process.env.SITE_URL}/dashboard/settings?selected=integrations`;
        return new Response(null, {
            status: 302, // Found (redirect)
            headers: { "Location": redirectUrl.toString() },
        });
    } catch (err) {
        console.error("Failed to handle HubSpot OAuth callback", err);
        return new Response("Failed to connect HubSpot Account", { status: 500 });
    }
});

http.route({
    path: "/hubspot-callback",
    method: "GET",
    handler: hubspotCallback,
});

export default http;
