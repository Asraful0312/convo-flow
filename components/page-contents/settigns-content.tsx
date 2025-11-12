"use client";

import { useSearchParams } from "next/navigation";
import BillingSection from "@/components/settings/billing-section";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProfileTab from "../settings/tabs/ProfileTab";
import NotificationsTab from "../settings/tabs/NotificationsTab";
import IntegrationsTab from "../settings/tabs/IntegrationsTab";
import WebhooksTab from "../settings/tabs/WebhooksTab";
import TeamTab from "../settings/tabs/TeamTab";
import SettingsLayout from "../settings/SettingsLayout";

type Props = {
  preloadedIntegrations: Preloaded<typeof api.integrations.getIntegrations>;
};

export default function SettingsContent({ preloadedIntegrations }: Props) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("selected") || "profile";

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

  return <SettingsLayout>{renderTab()}</SettingsLayout>;
}
