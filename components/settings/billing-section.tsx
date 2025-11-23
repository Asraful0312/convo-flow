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
import {
  CreditCard,
  ExternalLink,
  Zap,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Button } from "../ui/button";

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: "spring" } },
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
    100
  );
  const formPercentage = Math.min(
    (billingInfo.formsUsed / (billingInfo.formLimit || 1)) * 100,
    100
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* Main Plan Card - Spans 2 columns */}
      <motion.div variants={itemVariants as any} className="md:col-span-2">
        <Card className="h-full border-0 shadow-sm bg-linear-to-br from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
            <Zap className="w-24 h-24 text-[#F56A4D]" />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  {billingInfo.planName}
                  {billingInfo.tier === "business" && (
                    <Badge className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 text-white border-0">
                      PRO
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  {billingInfo.tier !== "free"
                    ? "Your active subscription plan"
                    : "Upgrade to unlock more features"}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#F56A4D] flex items-center justify-end">
                  {billingInfo.price !== "Custom" && "$"}
                  {billingInfo.price}
                  {billingInfo.price !== "Custom" && (
                    <span className="text-sm text-muted-foreground font-normal ml-1">
                      /mo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800/50 border shadow-sm">
                <div className="p-2 rounded-lg bg-[#F56A4D]/10 text-[#F56A4D]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Form Limit</p>
                  <p className="text-sm text-muted-foreground">
                    {isFinite(billingInfo.formLimit)
                      ? `${billingInfo.formLimit} forms`
                      : "Unlimited"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800/50 border shadow-sm">
                <div className="p-2 rounded-lg bg-[#F56A4D]/10 text-[#F56A4D]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Response Limit</p>
                  <p className="text-sm text-muted-foreground">
                    {isFinite(billingInfo.responseLimit)
                      ? `${billingInfo.responseLimit} / month`
                      : "Unlimited"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
             {billingInfo.tier !== "free" && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isBillingLoading}
                  className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 text-white shadow-md shadow-[#F56A4D]/20"
                >
                   {isBillingLoading ? "Loading..." : "Manage Subscription"}
                </Button>
              )}
               <Link href="/dashboard/pricing">
                <Button variant="outline" className="gap-2">
                  View Plans <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method - Spans 1 column */}
      <motion.div variants={itemVariants as any} className="md:col-span-1">
        <Card className="h-full border-0 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-[#F56A4D]" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-linear-to-br from-[#F56A4D] to-[#e0583b] text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <CreditCard className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                 <p className="text-xs text-white/80 uppercase tracking-wider mb-4">Current Method</p>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-6 bg-white/20 rounded-sm"></div>
                    <div className="text-lg font-mono">•••• 4242</div>
                 </div>
                 <div className="flex justify-between items-end">
                    <p className="text-xs text-white/80">Stripe Secure</p>
                 </div>
               </div>
            </div>
            <Button
              onClick={handleManageSubscription}
              disabled={isBillingLoading}
              variant="outline"
              className="w-full"
            >
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Stats - Responses */}
      <motion.div variants={itemVariants as any}>
        <Card className="h-full border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F56A4D]" />
              Responses Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">
                  {billingInfo.responsesUsed}
                </span>
                <span className="text-sm text-muted-foreground mb-1">
                  / {isFinite(billingInfo.responseLimit) ? billingInfo.responseLimit : "∞"}
                </span>
              </div>
              <Progress
                value={responsePercentage}
                className="h-2"
                indicatorClassName="bg-[#F56A4D]"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Resets on the 1st of next month
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Stats - Forms */}
      <motion.div variants={itemVariants as any}>
        <Card className="h-full border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F56A4D]" />
              Forms Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">
                  {billingInfo.formsUsed}
                </span>
                <span className="text-sm text-muted-foreground mb-1">
                   / {isFinite(billingInfo.formLimit) ? billingInfo.formLimit : "∞"}
                </span>
              </div>
              <Progress
                value={formPercentage}
                className="h-2"
                indicatorClassName="bg-[#F56A4D]"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Active forms in your account
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Callout (if not business) or Support */}
      <motion.div variants={itemVariants as any}>
         <Card className="h-full border-0 shadow-sm bg-[#F56A4D]/5 border-[#F56A4D]/10 flex flex-col justify-center items-center text-center p-4">
            <div className="p-3 rounded-full bg-[#F56A4D]/10 mb-3">
               <ExternalLink className="w-6 h-6 text-[#F56A4D]" />
            </div>
            <h3 className="font-semibold mb-1">Need more power?</h3>
            <p className="text-sm text-muted-foreground mb-4">
               Upgrade to Business for unlimited limits.
            </p>
            <Link href="/dashboard/pricing" className="w-full">
               <Button variant="outline" className="w-full border-[#F56A4D]/20 hover:bg-[#F56A4D]/10 hover:text-[#F56A4D]">
                  View Upgrades
               </Button>
            </Link>
         </Card>
      </motion.div>
    </motion.div>
  );
}

function BillingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
      <div className="md:col-span-1">
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-[150px] w-full rounded-xl" />
      <Skeleton className="h-[150px] w-full rounded-xl" />
      <Skeleton className="h-[150px] w-full rounded-xl" />
    </div>
  );
}
