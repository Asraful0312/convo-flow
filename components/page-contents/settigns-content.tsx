"use client";

import { useSearchParams } from "next/navigation";
import BillingSection from "@/components/settings/billing-section";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProfileTab from "../settings/tabs/ProfileTab";
import NotificationsTab from "../settings/tabs/NotificationsTab";
import IntegrationsTab from "../settings/tabs/IntegrationsTab";
import WebhooksTab from "../settings/tabs/WebhooksTab";
import TeamTab from "../settings/tabs/TeamTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

type Props = {
  preloadedIntegrations: Preloaded<typeof api.integrations.getIntegrations>;
};

// Tabs that viewers cannot access
const restrictedTabs = ["integrations", "webhooks", "billing", "notifications"];

export default function SettingsContent({ preloadedIntegrations }: Props) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("selected") || "profile";
  
  const user = useQuery(api.auth.loggedInUser);
  const userRole = useQuery(
    api.users.getRole,
    user?.activeWorkspaceId ? { workspaceId: user.activeWorkspaceId } : "skip"
  );

  // Only check restriction when role has loaded AND user is a viewer
  const isRoleLoaded = user !== undefined && (user?.activeWorkspaceId ? userRole !== undefined : true);
  const isViewer = userRole === "viewer";

  // Check if viewer is trying to access restricted tabs
  if (isRoleLoaded && isViewer && restrictedTabs.includes(activeTab)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              You don't have permission to access this section. Please contact your workspace admin to change your role.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "team":
        return <TeamTab />;
      case "notifications":
        return <NotificationsTab />;
      case "integrations":
        return (
          <IntegrationsTab preloadedIntegrations={preloadedIntegrations} />
        );
      case "webhooks":
        return <WebhooksTab preloadedIntegrations={preloadedIntegrations} />;
      case "billing":
        return <BillingSection />;
      default:
        return <ProfileTab />;
    }
  };

  return renderTab();
}

