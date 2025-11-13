"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, LogOut, Copy } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import ProfileSection from "@/components/settings/profile-section";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HighlightedTitle } from "@/components/HighlightedTitle";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

export default function ProfileTab() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 w-full max-w-5xl mx-auto p-1"
    >
      {/* Hero Header – Avatar + Rich Info */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8"
      >
        <div className="flex flex-col gap-4 items-center">
          {/* Avatar */}
          <Avatar className="w-28 h-28 ring-4 ring-[#F56A4D]/20 shrink-0">
            <AvatarImage src={user?.image} alt={user?.name} />
            <AvatarFallback className="text-3xl bg-linear-to-br from-[#F56A4D] to-[#f78b6d] text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Name + Email */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-center">
              {user?.name || "User"}
            </h1>
            <p className="text-muted-foreground text-center">{user?.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="flex-1 w-full space-y-4">
          {/* Grid of extra data */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
            {/* Active Workspace */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F56A4D]" />
                <span className="font-medium">
                  {user?.activeWorkspace?.name || "Personal"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-linear-to-r from-[#F56A4D]/5 to-[#F56A4D]/10 border">
              <span className="font-medium capitalize">
                {user?.subscriptionTier || "Free"}
              </span>
              {user?.subscriptionTier === "business" && (
                <Badge className="bg-[#F56A4D] text-white text-xs">Pro</Badge>
              )}
            </div>

            {/* Subscription Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
              <span className="font-medium">Status</span>
              <Badge
                variant={
                  user?.subscriptionStatus === "active"
                    ? "default"
                    : "secondary"
                }
                className={
                  user?.subscriptionStatus === "active"
                    ? "bg-green-600 text-white"
                    : ""
                }
              >
                {user?.subscriptionStatus || "—"}
              </Badge>
            </div>

            {/* Customer ID (copyable) */}
            {user?.stripeCustomerId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground">Cust ID</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    …{user.stripeCustomerId.slice(-6)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(user.stripeCustomerId!);
                      toast.success("Customer ID copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Subscription ID (copyable) */}
            {user?.stripeSubscriptionId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground">Sub ID</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    …{user.stripeSubscriptionId.slice(-6)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(user.stripeSubscriptionId!);
                      toast.success("Subscription ID copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <ProfileSection />
      </motion.div>

      {/* Security & Sign Out */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F56A4D]" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your password and account access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
