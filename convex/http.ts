import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

http.route({
    path: "/stripe",
    method: "POST",
    handler: stripeWebhook,
});

export default http;
