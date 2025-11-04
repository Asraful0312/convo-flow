"use client"

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SubscriptionTier } from "@/lib/types";
import { Building2, Check, Sparkles, Users, X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    tier: "free" as SubscriptionTier,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out CANDID",
    features: [
      "3 active forms",
      "100 responses per month",
      "Basic question types",
      "Email notifications",
      "CSV export",
      "CANDID branding",
    ],
    limitations: ["No voice features", "No custom branding", "No integrations"],
    cta: "Current Plan",
    highlighted: false,
    icon: Sparkles,
  },
  {
    tier: "pro" as SubscriptionTier,
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For professionals and small teams",
    features: [
      "Unlimited forms",
      "1,000 responses per month",
      "All question types",
      "Voice input & output",
      "Custom branding",
      "Remove CANDID branding",
      "Webhooks",
      "Zapier integration",
      "Priority support",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    highlighted: true,
    icon: Sparkles,
  },
  {
    tier: "business" as SubscriptionTier,
    name: "Business",
    price: "$49",
    period: "per month",
    description: "For growing teams and businesses",
    features: [
      "Everything in Pro",
      "10,000 responses per month",
      "Team collaboration",
      "Role-based permissions",
      "Advanced analytics",
      "AI-powered insights",
      "Custom domains",
      "API access",
      "White-label option",
      "Dedicated support",
    ],
    limitations: [],
    cta: "Upgrade to Business",
    highlighted: false,
    icon: Users,
  },
  {
    tier: "enterprise" as SubscriptionTier,
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations",
    features: [
      "Everything in Business",
      "Unlimited responses",
      "SSO (SAML, OKTA)",
      "Advanced security",
      "Custom SLAs",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment option",
      "24/7 phone support",
    ],
    limitations: [],
    cta: "Contact Sales",
    highlighted: false,
    icon: Building2,
  },
]

export default function PricingPage() {
  const user = useQuery(api.auth.loggedInUser)
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const getPortalUrl = useAction(api.stripe.getPortalUrl);
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === "enterprise" || tier === "free") {
      window.location.href = "mailto:sales@candid.app?subject=Enterprise Plan Inquiry"
      return
    }

    setIsLoading(tier)
    try {
      const url = await createCheckoutSession({ tier });
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Error creating checkout session.");
    } finally {
      setIsLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading("manage");
    try {
        const url = await getPortalUrl({});
        window.location.href = url;
    } catch (err) {
        console.error(err);
        alert("Error redirecting to billing portal.");
    } finally {
        setIsLoading(null);
    }
  }

  const currentTier = user?.subscriptionTier || "free"

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-heading text-4xl font-bold text-(--ink-night)">Choose your plan</h1>
          <p className="text-lg text-muted-foreground">Start free, upgrade when you need more. Cancel anytime.</p>
        </div>

        {/* Current Plan Banner */}
        {currentTier !== "free" && (
          <Card className="mb-8 border-(--candid-teal) bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="mb-1 font-heading text-lg font-semibold text-(--ink-night)">
                  Current Plan: {plans.find((p) => p.tier === currentTier)?.name}
                </h3>
                <p className="text-sm text-muted-foreground">You can manage your subscription in the billing portal.</p>
              </div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading === "manage"}
                className="border-chart-5 text-chart-5 hover:bg-chart-5 hover:text-white"
              >
                {isLoading === "manage" ? "Loading..." : "Manage Subscription"}
              </Button>
            </div>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentTier === plan.tier
            const canUpgrade =
              (currentTier === "free" && plan.tier !== "free") ||
              (currentTier === "pro" && (plan.tier === "business" || plan.tier === "enterprise")) ||
              (currentTier === "business" && plan.tier === "enterprise")

            return (
              <Card
                key={plan.tier}
                className={`relative flex flex-col overflow-hidden transition-all hover:shadow-lg ${
                  plan.highlighted
                    ? "border-2 border-(--candid-coral) shadow-md"
                    : "border border-(--bg-mica)"
                } ${isCurrentPlan ? "bg-background" : "bg-white"}`}
              >
                {plan.highlighted && (
                  <div className="absolute right-4 top-4 rounded-full bg-(--candid-coral) px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="flex-1 p-6">
                  {/* Icon */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                    <Icon className="h-6 w-6 text-(--candid-coral)" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="mb-2 font-heading text-2xl font-bold text-(--ink-night)">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="font-heading text-4xl font-bold text-(--ink-night)">{plan.price}</span>
                    {plan.period !== "contact us" && (
                      <span className="ml-2 text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>

                  {/* Features */}
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--candid-teal)" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={`limit-${index}`} className="flex items-start gap-2 opacity-50">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="p-6 pt-0">
                  <Button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={isCurrentPlan || isLoading !== null}
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-(--candid-coral) text-white hover:bg-(--candid-coral)/90"
                        : isCurrentPlan
                          ? "bg-(--bg-mica) text-muted-foreground cursor-not-allowed"
                          : "bg-(--candid-teal) text-white hover:bg-(--candid-teal)/90"
                    }`}
                  >
                    {isLoading === plan.tier ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : canUpgrade ? (
                      plan.cta
                    ) : (
                      "Contact Sales"
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold text-(--ink-night)">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="bg-white p-6">
              <h3 className="mb-2 font-heading text-lg font-semibold text-(--ink-night)">
                Can I change plans anytime?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while
                downgrades take effect at the end of your current billing period.
              </p>
            </Card>
            <Card className="bg-white p-6">
              <h3 className="mb-2 font-heading text-lg font-semibold text-(--ink-night)">
                What happens if I exceed my response limit?
              </h3>
              <p className="text-sm text-muted-foreground">
                We'll notify you when you're approaching your limit. You can upgrade to a higher plan or purchase
                additional responses as needed. Your forms will continue to work.
              </p>
            </Card>
            <Card className="bg-white p-6">
              <h3 className="mb-2 font-heading text-lg font-semibold text-(--ink-night)">
                Do you offer annual billing?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes! Annual billing is available with a 20% discount. Contact us to set up annual billing.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white p-6">
            <h3 className="mb-4 font-heading text-xl font-bold text-(--ink-night)">Cancel Subscription?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to cancel your subscription? You'll have access to your current plan until the end
              of your billing period, then you'll be moved to the Free plan.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={isLoading === "cancel"}
              >
                Keep Subscription
              </Button>
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading === "cancel"}
                className="flex-1 bg-chart-5 text-white hover:bg-(--rose)/90"
              >
                {isLoading === "cancel" ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Canceling...
                  </span>
                ) : (
                  "Yes, Cancel"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
