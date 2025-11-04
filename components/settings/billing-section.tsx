"use client"

import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";

export default function BillingSection() {
  const billingInfo = useQuery(api.billing.getBillingInfo);
  const getPortalUrl = useAction(api.stripe.getPortalUrl);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsBillingLoading(true);
    try {
      const url = await getPortalUrl({});
      window.location.href = url;
    } catch (e) {
      console.error(e);
         const errorMessage =
        e instanceof ConvexError
          ? 
            e.data 
          : 
            "Internal Error!";
      toast.error(errorMessage)
    } finally {
      setIsBillingLoading(false);
    }
  };

  if (!billingInfo) {
    return <div>Loading...</div>
  }

  const responsePercentage = (billingInfo.responsesUsed / (billingInfo.responseLimit || 1)) * 100;
  const formPercentage = (billingInfo.formsUsed / (billingInfo.formLimit || 1)) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-6 rounded-lg border-2 border-[#6366f1] bg-[#6366f1]/5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{billingInfo.planName} Plan</h3>
                {billingInfo.tier !== 'free' && <Badge className="bg-[#6366f1] text-white">Current</Badge>}
              </div>
              <p className="text-muted-foreground">{isFinite(billingInfo.formLimit) ? `${billingInfo.formLimit} forms` : 'Unlimited forms'}, {isFinite(billingInfo.responseLimit) ? `${billingInfo.responseLimit} responses` : 'Unlimited responses'}/month</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{billingInfo.price}</div>
              {billingInfo.price !== "Custom" && <div className="text-sm text-muted-foreground">per month</div>}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Usage This Month</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Responses</span>
                  <span className="text-sm text-muted-foreground">
                    {billingInfo.responsesUsed} / {isFinite(billingInfo.responseLimit) ? billingInfo.responseLimit : '∞'}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#6366f1] to-[#f97316]" style={{ width: `${responsePercentage}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Forms</span>
                  <span className="text-sm text-muted-foreground">
                    {billingInfo.formsUsed} / {isFinite(billingInfo.formLimit) ? billingInfo.formLimit : '∞'}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#6366f1] to-[#f97316]" style={{ width: `${formPercentage}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href='/dashboard/pricing'>
              <Button variant="outline" className="bg-transparent">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Plans
              </Button>
            </Link>
            {billingInfo.tier !== 'free' && (
              <Button onClick={handleManageSubscription} variant="outline" className="bg-transparent">
                {isBillingLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">You can manage your payment method, view invoices, and update your billing information in the Stripe Billing Portal.</p>
          <Button onClick={handleManageSubscription} variant="outline" className="bg-transparent">
            {isBillingLoading ? "Loading..." : "Go to Billing Portal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}