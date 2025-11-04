"use node";

import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const domain = process.env.SITE_URL || "http://localhost:3000";

const priceIds = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  business: process.env.STRIPE_BUSINESS_PRICE_ID!,
};

export const createCheckoutSession = action({
  args: {
    tier: v.union(v.literal("pro"), v.literal("business")),
  },
  handler: async (ctx, { tier }): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("You must be logged in to subscribe.");
    }

    const user = await ctx.runQuery(internal.users.getUserById, { userId });
    if (!user) {
      throw new ConvexError("User not found.");
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await ctx.runMutation(internal.users.updateUserStripeCustomerIdMutation, {
        userId,
        stripeCustomerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceIds[tier], quantity: 1 }],
      mode: "subscription",
      success_url: `${domain}/dashboard/pricing?success=true`,
      cancel_url: `${domain}/dashboard/pricing?canceled=true`,
      metadata: {
        userId: userId.toString(),
        tier,
      },
    });

    return session.url!;
  },
});

export const getPortalUrl = action({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new ConvexError("You must be logged in to manage your subscription.");
        }

        const user = await ctx.runQuery(internal.users.getUserById, { userId });
        if (!user || !user.stripeCustomerId) {
            throw new ConvexError("Stripe customer not found.");
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${domain}/dashboard/pricing`,
        });

        return portalSession.url;
    },
});


export const fulfill = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, { signature, payload }) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      const session = event.data.object as Stripe.Checkout.Session;

      if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = session.metadata!.userId as any;
        const tier = session.metadata!.tier as "pro" | "business";

        await ctx.runMutation(internal.users.updateUserSubscription, {
          userId,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          subscriptionTier: tier,
          subscriptionStatus: "active",
        });
      }

      if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await ctx.runQuery(internal.users.getUserByStripeCustomerId, { stripeCustomerId: subscription.customer as string });

        if (user) {
            const priceId = subscription.items.data[0].price.id;
            const tier = Object.keys(priceIds).find(key => priceIds[key as keyof typeof priceIds] === priceId) as "pro" | "business" | undefined;

            await ctx.runMutation(internal.users.updateUserSubscription, {
                userId: user._id,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                subscriptionTier: subscription.status === "canceled" ? "free" : (tier || "free"),
                subscriptionStatus: subscription.status as any,
            });
        }
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: (err as any).message };
    }
  },
});

export const updateUserStripeCustomerId = action({
    args: { userId: v.id("users"), stripeCustomerId: v.string() },
    handler: async (ctx, { userId, stripeCustomerId }) => {
        await ctx.runMutation(internal.users.updateUserStripeCustomerIdMutation, {userId, stripeCustomerId });
    },
});



