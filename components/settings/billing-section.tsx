"use client";

import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useState } from "react";
import { CreditCard, ExternalLink, DollarSign } from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";

import { motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";
import { Progress } from "../ui/progress";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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
      const errorMessage =
        e instanceof ConvexError ? e.data : "Internal Error!";
      toast.error(errorMessage);
    } finally {
      setIsBillingLoading(false);
    }
  };

  if (!billingInfo) {
    return <BillingSkeleton />;
  }

  const responsePercentage = Math.min(
    (billingInfo.responsesUsed / (billingInfo.responseLimit || 1)) * 100,
    100,
  );
  const formPercentage = Math.min(
    (billingInfo.formsUsed / (billingInfo.formLimit || 1)) * 100,
    100,
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Subscription Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F56A4D]/20">
                  <CreditCard className="w-5 h-5 text-[#F56A4D]" />
                </div>
                <div>
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <CardDescription>
                    {billingInfo.tier !== "free"
                      ? "Active subscription"
                      : "Free tier"}
                  </CardDescription>
                </div>
              </div>
              {billingInfo.tier !== "free" && (
                <Badge className="bg-[#F56A4D] text-white">Active</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Plan Highlight */}
            <div className="flex items-center justify-between p-5 rounded-xl bg-linear-to-r from-[#F56A4D]/10 to-[#F56A4D]/5 border border-[#F56A4D]/20">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {billingInfo.planName}
                  {billingInfo.tier === "business" && (
                    <Badge className="bg-[#F56A4D] text-white text-xs">
                      Pro
                    </Badge>
                  )}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {isFinite(billingInfo.formLimit)
                    ? `${billingInfo.formLimit} forms`
                    : "Unlimited forms"}
                  {" • "}
                  {isFinite(billingInfo.responseLimit)
                    ? `${billingInfo.responseLimit} responses`
                    : "Unlimited responses"}
                  /month
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold flex items-center justify-end gap-1">
                  <DollarSign className="w-6 h-6 text-[#F56A4D]" />
                  {billingInfo.price}
                </div>
                {billingInfo.price !== "Custom" && (
                  <p className="text-sm text-muted-foreground">per month</p>
                )}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="space-y-5">
              <h4 className="font-semibold text-lg">Usage This Month</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Responses */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Responses</span>
                    <span className="text-muted-foreground">
                      {billingInfo.responsesUsed} /{" "}
                      {isFinite(billingInfo.responseLimit)
                        ? billingInfo.responseLimit
                        : "∞"}
                    </span>
                  </div>
                  <Progress
                    value={responsePercentage}
                    className="h-3 bg-muted"
                    indicatorClassName="bg-gradient-to-r from-[#F56A4D] to-[#f97316]"
                  />
                </div>

                {/* Forms */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Forms</span>
                    <span className="text-muted-foreground">
                      {billingInfo.formsUsed} /{" "}
                      {isFinite(billingInfo.formLimit)
                        ? billingInfo.formLimit
                        : "∞"}
                    </span>
                  </div>
                  <Progress
                    value={formPercentage}
                    className="h-3 bg-muted"
                    indicatorClassName="bg-gradient-to-r from-[#F56A4D] to-[#f97316]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/pricing" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All Plans
                </Button>
              </Link>
              {billingInfo.tier !== "free" && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isBillingLoading}
                  className="flex-1 bg-[#F56A4D] hover:bg-[#F56A4D]/90 text-white"
                >
                  {isBillingLoading ? "Loading..." : "Manage Subscription"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Update card, view invoices, and manage billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#F56A4D] text-white text-xs">
                  <CreditCard className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Managed via Stripe</p>
                <p className="text-sm text-muted-foreground">
                  Securely stored and encrypted
                </p>
              </div>
            </div>
            <Button
              onClick={handleManageSubscription}
              disabled={isBillingLoading}
              variant="outline"
              className="w-full"
            >
              {isBillingLoading ? "Opening..." : "Open Billing Portal"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Skeleton Loader
function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
