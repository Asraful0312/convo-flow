
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBillingInfo = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            return null;
        }

        const planLimits = {
            free: { forms: 3, responses: 100, price: "$0", name: "Free" },
            pro: { forms: Infinity, responses: 1000, price: "$19", name: "Pro" },
            business: { forms: Infinity, responses: 10000, price: "$49", name: "Business" },
            enterprise: { forms: Infinity, responses: Infinity, price: "Custom", name: "Enterprise" },
        };

        const tier = user.subscriptionTier || "free";
        const currentPlan = planLimits[tier as keyof typeof planLimits];

        // Get current usage
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const userForms = await ctx.db
            .query("forms")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const activeFormsCount = userForms.filter(f => f.status === 'published').length;

        let monthlyResponses = 0;
        for (const form of userForms) {
            const responses = await ctx.db
                .query("responses")
                .withIndex("by_form", (q) => q.eq("formId", form._id))
                .filter(q => q.gt(q.field("startedAt"), startOfMonth.getTime()))
                .collect();
            monthlyResponses += responses.length;
        }

        return {
            tier,
            planName: currentPlan.name,
            price: currentPlan.price,
            responseLimit: currentPlan.responses,
            formLimit: currentPlan.forms,
            responsesUsed: monthlyResponses,
            formsUsed: activeFormsCount,
        };
    }
});
