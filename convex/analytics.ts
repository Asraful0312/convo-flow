
import { query } from "./_generated/server";
import { v } from "convex/values";
import { assertViewer } from "./auth_helpers";

export const getAnalytics = query({
    args: {
        workspaceId: v.id("workspaces"),
        timeRange: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
    },
    handler: async (ctx, { workspaceId, timeRange }) => {
        await assertViewer(ctx, workspaceId);

        // 1. Calculate startTime
        const now = new Date();
        let startTime = new Date();
        switch (timeRange) {
            case "7d": startTime.setDate(now.getDate() - 7); break;
            case "30d": startTime.setDate(now.getDate() - 30); break;
            case "90d": startTime.setDate(now.getDate() - 90); break;
            case "1y": startTime.setFullYear(now.getFullYear() - 1); break;
        }
        const startTimeMs = startTime.getTime();

        // 2. Get workspace's forms
        const forms = await ctx.db
            .query("forms")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
            .collect();

        const formIds = forms.map(f => f._id);

        // 3. Get all responses for these forms within the time range
        const allResponses = (await Promise.all(
            formIds.map(formId =>
                ctx.db
                    .query("responses")
                    .withIndex("by_form", (q) => q.eq("formId", formId))
                    .filter(q => q.gt(q.field("startedAt"), startTimeMs))
                    .collect()
            )
        )).flat();

        // Key Metrics
        const totalResponses = allResponses.length;
        const completedResponses = allResponses.filter(r => r.status === "completed");
        const avgCompletionRate = totalResponses > 0 ? (completedResponses.length / totalResponses) * 100 : 0;
        
        const completionTimes = completedResponses
            .map(r => r.completedAt! - r.startedAt)
            .filter(t => t > 0);
        const avgCompletionTime = completionTimes.length > 0 
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
            : 0;
        
        const activeForms = forms.filter(f => f.status === "published").length;
        const draftForms = forms.filter(f => f.status === "draft").length;

        // Response Trend (daily)
        const responseTrend: { [key: string]: number } = {};
        for (const response of allResponses) {
            const date = new Date(response.startedAt).toISOString().split('T')[0];
            responseTrend[date] = (responseTrend[date] || 0) + 1;
        }
        const trendData = Object.entries(responseTrend).map(([date, responses]) => ({ date, responses }));

        // Completion Rates by Form
        const completionRatesByForm = forms.map(form => {
            const responsesForForm = allResponses.filter(r => r.formId === form._id);
            const completed = responsesForForm.filter(r => r.status === "completed").length;
            const rate = responsesForForm.length > 0 ? (completed / responsesForForm.length) * 100 : 0;
            return { form: form.title, rate };
        });

        // Device Breakdown
        const deviceBreakdown: { [key: string]: number } = { Desktop: 0, Mobile: 0, Tablet: 0, Other: 0 };
        allResponses.forEach(response => {
            const userAgent = response.metadata?.device?.toLowerCase() || "";
            if (!userAgent) {
                deviceBreakdown.Other++;
            } else if (userAgent.includes("mobile")) {
                deviceBreakdown.Mobile++;
            } else if (userAgent.includes("tablet")) {
                deviceBreakdown.Tablet++;
            } else {
                deviceBreakdown.Desktop++;
            }
        });
        const deviceData = totalResponses > 0 ? Object.entries(deviceBreakdown)
            .map(([name, value]) => ({ name, value: (value / totalResponses) * 100 }))
            .filter(d => d.value > 0) : [];

        // Geographic Distribution
        const geographicData: { [key:string]: number } = {};
        allResponses.forEach(response => {
            const country = response.metadata?.location?.country || "Unknown";
            geographicData[country] = (geographicData[country] || 0) + 1;
        });
        const geoData = Object.entries(geographicData)
            .map(([country, responses]) => ({ country, responses }))
            .sort((a, b) => b.responses - a.responses)
            .slice(0, 5); // Top 5

        // AI Insights (placeholder)
        const aiInsights = [
            {
              type: "positive",
              title: "Completion Rate Improving",
              description: "Your average completion rate increased by 12% this week compared to last week.",
            },
            {
              type: "neutral",
              title: "Mobile Traffic Growing",
              description: "40% of responses now come from mobile devices. Consider optimizing for mobile.",
            },
            {
              type: "suggestion",
              title: "Question Optimization",
              description: "Question 3 in 'Customer Feedback' has a 25% drop-off rate. Consider simplifying it.",
            },
          ];

        return {
            keyMetrics: {
                totalResponses,
                avgCompletionRate,
                avgCompletionTime,
                activeForms,
                draftForms,
            },
            responseTrend: trendData,
            completionRates: completionRatesByForm,
            deviceBreakdown: deviceData,
            geographicData: geoData,
            aiInsights,
        };
    }
});
