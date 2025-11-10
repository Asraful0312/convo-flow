"use client";

import { useSearchParams } from "next/navigation";
import SettingsLayout from "./SettingsLayout";
import ProfileTab from "./tabs/ProfileTab";
import NotificationsTab from "./tabs/NotificationsTab";
import IntegrationsTab from "./tabs/IntegrationsTab";
import BillingSection from "@/components/settings/billing-section";
import WebhooksTab from "./tabs/WebhooksTab";

type Props = {
  preloadedIntegrations: any;
};

export default function SettingsContent({ preloadedIntegrations }: Props) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("selected") || "profile";

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
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
