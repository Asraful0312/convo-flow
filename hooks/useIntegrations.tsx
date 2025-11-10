"use client";
import { useState, useEffect } from "react";
import {
  usePreloadedQuery,
  useMutation,
  useAction,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CreditCard, UserCog, Webhook, Zap } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const availableIntegrations = [
  {
    name: "Zapier",
    type: "zapier",
    description: "Connect to 5,000+ apps",
    icon: "⚡",
    iconSrc: "https://cdn.worldvectorlogo.com/logos/zapier.svg",
    color: "bg-orange-100 dark:bg-orange-900/30",
    fields: [{ name: "webhookUrl", label: "Webhook URL", type: "text" }],
    instructions:
      "1. Create a new Zap. 2. Choose 'Webhooks by Zapier' as the trigger. 3. Copy the webhook URL and paste it here.",
  },
  {
    name: "Slack",
    type: "slack",
    description: "Get notifications in Slack",
    icon: "💬",
    iconSrc: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    color: "bg-purple-100 dark:bg-purple-900/30",
    fields: [], // Fields are now handled by OAuth
    instructions:
      "1. Connect your Slack Account. 2. Choose a channel during the setup process.",
  },
  {
    name: "Google Sheets",
    type: "google_sheets",
    description: "Export responses automatically",
    icon: "📊",
    iconSrc:
      "https://cdn.worldvectorlogo.com/logos/google-sheets-logo-icon.svg",
    color: "bg-green-100 dark:bg-green-900/30",
    fields: [], // Fields are now handled by OAuth
    instructions:
      "1. Connect your Google Account. 2. Select the Google Sheet you want to sync to from the dropdown.",
  },
  {
    name: "HubSpot",
    type: "hubspot",
    description: "Sync leads to your CRM",
    icon: "🎯",
    iconSrc: "/hubspots.png",
    color: "bg-blue-100 dark:bg-blue-900/30",
    fields: [], // No fields for OAuth
    instructions:
      "1. Connect your HubSpot Account. 2. We will automatically sync new contacts.",
  },
  {
    name: "Airtable",
    type: "airtable",
    description: "Store responses in Airtable",
    icon: "🗂️",
    iconSrc:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAjVBMVEVHcEz+uwD9tQDtnB/9tQD9tAD8tAD/tAD+tQD+tQD+tgD9tQD9tAD9tgDfJ1a8IEi6EEv/uAD9tAD9tQAOwP8Xv/8YwP/5K2DnJ1m5H0e6IEe8HUnxJ2AXwP8Wv/8Yv/8Yv/8YwP/5K2DDIUv9tQANx/8OwP8YwP8Uwv8UwP/WJFK9IEnAIEj5LGD5K2Cg/8aNAAAAL3RSTlMAJmwOVdb/HoR9NKfqiK7GUke6t1XEueL//+yMLzOT9v/h//+5D1zdJpr/mkSwqkV2VRMAAADASURBVHgBvc5FFgJBEATRxN3G3d3ufzxacGqWENv/SvCHJtPphJbZfLFkLeazL1qtBQnerN5ou1u+tdveZTbdL7/aTyVul2QTqZPD/mtwvRJ0PJ2Bi/JK6gXQdIOhadmO62G2WdyfncEPwiiKOSZWattiPNvv2VBe6BGvFJgkTNn4DKyqZkNvmDQ2r0VeSnhDoacOfkRhYjEC/JDC3gNGcGBEoyACYwAeIxINiAgM6wojqBc5QGIY+CCrQkPDr7sCTOYgaxntCWQAAAAASUVORK5CYII=",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    fields: [
      { name: "baseId", label: "Base ID", type: "text" },
      { name: "tableId", label: "Table ID", type: "text" },
    ],
    instructions:
      "1. Connect your Airtable account. 2. Find the Base ID and Table ID in the API documentation for your base.",
  },
  {
    name: "Notion",
    type: "notion",
    description: "Add responses to Notion",
    icon: "📝",
    iconSrc: "https://cdn.worldvectorlogo.com/logos/notion-2.svg",
    color: "bg-gray-100 dark:bg-gray-800",
    fields: [], // Fields are now handled by OAuth
    instructions:
      "1. Connect your Notion Account. 2. Share a database with the integration. 3. Select the database from the dropdown.",
  },
  {
    name: "Email",
    type: "email",
    description: "Receive responses via email",
    icon: "✉️",
    iconSrc: "/gmail.png",
    color: "bg-gray-100 dark:bg-gray-800",
    fields: [
      {
        name: "recipientEmail",
        label: "Recipient Email",
        type: "email",
        required: true,
      },
      {
        name: "senderEmail",
        label: "Sender Email (Optional)",
        type: "email",
      },
      { name: "smtpHost", label: "SMTP Host", type: "text", required: true },
      { name: "smtpPort", label: "SMTP Port", type: "number", required: true },
      {
        name: "smtpUser",
        label: "SMTP Username",
        type: "text",
        required: true,
      },
      {
        name: "smtpPassword",
        label: "SMTP Password",
        type: "password",
        required: true,
      },
    ],
    instructions:
      "Enter your SMTP server details to send form responses to an email address. We strongly recommend using a dedicated app password rather than your main account password.",
  },
  {
    name: "Salesforce",
    type: "salesforce",
    description: "Create leads in Salesforce",
    icon: "☁️",
    iconSrc: "https://cdn.worldvectorlogo.com/logos/salesforce-2.svg",
    color: "bg-blue-100 dark:bg-blue-900/30",
    fields: [],
    instructions:
      "1. Connect your Salesforce account. 2. We will automatically create a new Lead for each form response.",
  },
];

export default function useIntegrations(preloadedIntegrations: any) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTabParam = searchParams.get("selected") || "profile";
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Profile",
      href: "/dashboard/settings?selected=profile",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Notifications",
      href: "/dashboard/settings?selected=notifications",
      icon: (
        <Bell className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Integrations",
      href: "/dashboard/settings?selected=integrations",
      icon: (
        <Zap className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Webhooks",
      href: "/dashboard/settings?selected=webhooks",
      icon: (
        <Webhook className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
    {
      label: "Billing",
      href: "/dashboard/settings?selected=billing",
      icon: (
        <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
  ];

  const userWebhooks = useQuery(api.webhooks.get);
  const addWebhookMutation = useMutation(api.webhooks.add);
  const removeWebhookMutation = useMutation(api.webhooks.remove);

  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "response.completed",
  ]);

  const addWebhook = async () => {
    if (newWebhookUrl.trim() && selectedEvents.length > 0) {
      try {
        await addWebhookMutation({
          url: newWebhookUrl,
          name: "New Webhook",
          events: selectedEvents,
        });
        setNewWebhookUrl("");
        toast.success("Webhook added successfully!");
      } catch (error: any) {
        toast.error(error.data || "Failed to add webhook.");
      }
    } else {
      toast.error("Please provide a valid URL and select at least one event.");
    }
  };

  const removeWebhook = async (id: Id<"webhooks">) => {
    try {
      await removeWebhookMutation({ webhookId: id });
      toast.success("Webhook removed successfully!");
    } catch (error) {
      toast.error("Failed to remove webhook.");
    }
  };

  const webhooks = userWebhooks || [];

  const user = useQuery(api.auth.loggedInUser);
  const billingInfo = useQuery(api.billing.getBillingInfo);
  const userIntegrations = usePreloadedQuery(preloadedIntegrations);
  const addIntegration = useMutation(api.integrations.addIntegration);
  const deleteIntegration = useMutation(api.integrations.deleteIntegration);
  const updateIntegrationConfig = useMutation(
    api.integrations.updateIntegrationConfig,
  );
  const getGoogleOAuthUrl = useAction(api.google.getOAuthUrl);
  const getNotionOAuthUrl = useAction(api.notion.getOAuthUrl);
  const getHubSpotOAuthUrl = useAction(api.hubspot.getOAuthUrl);
  const getSalesforceOAuthUrl = useAction(api.salesforce.getOAuthUrl);
  const getNotionDatabases = useAction(api.notion.getAccessibleDatabases);
  const getGoogleSheets = useAction(api.google.getAccessibleSheets);
  const getSlackOAuthUrl = useAction(api.slack.getOAuthUrl);
  const getAirtableOAuthUrl = useAction(api.airtable.getOAuthUrl);

  const [isIntegrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [integrationConfig, setIntegrationConfig] = useState<any>({});
  const [sheetId, setSheetId] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [notionDatabases, setNotionDatabases] = useState<
    { id: string; title: string }[]
  >([]);
  const [isFetchingDatabases, setIsFetchingDatabases] = useState(false);
  const [googleSheets, setGoogleSheets] = useState<
    { id: string; title: string }[]
  >([]);
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);

  const integrations = availableIntegrations.map((availInt) => {
    const connectedInt = userIntegrations?.find(
      (userInt: any) => userInt.type === availInt.type,
    );
    return {
      ...availInt,
      connected: !!connectedInt,
      id: connectedInt?._id,
      config: connectedInt?.config,
    };
  });

  const notionIntegration = integrations.find((int) => int.type === "notion");
  const googleSheetsIntegration = integrations.find(
    (int) => int.type === "google_sheets",
  );

  useEffect(() => {
    if (googleSheetsIntegration?.connected && !sheetId) {
      setSheetId(googleSheetsIntegration.config?.sheetId || "");
    }
    if (notionIntegration?.connected && !notionDatabaseId) {
      setNotionDatabaseId(notionIntegration.config?.databaseId || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrations]);

  useEffect(() => {
    if (notionIntegration?.connected) {
      setIsFetchingDatabases(true);
      getNotionDatabases()
        .then(setNotionDatabases)
        .catch(() => toast.error("Failed to fetch Notion databases."))
        .finally(() => setIsFetchingDatabases(false));
    }
  }, [notionIntegration?.connected, getNotionDatabases]);

  useEffect(() => {
    if (googleSheetsIntegration?.connected) {
      setIsFetchingSheets(true);
      getGoogleSheets()
        .then(setGoogleSheets)
        .catch(() => toast.error("Failed to fetch Google Sheets."))
        .finally(() => setIsFetchingSheets(false));
    }
  }, [googleSheetsIntegration?.connected, getGoogleSheets]);

  const handleConnectClick = (integration: any) => {
    if (billingInfo?.tier === "free") {
      toast.error(
        "Integrations are only available on Pro and Business plans. Please upgrade your plan.",
        {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/dashboard/pricing"),
          },
        },
      );
      return;
    }
    setSelectedIntegration(integration);
    setIntegrationConfig({});
    setIntegrationModalOpen(true);
  };

  const handleConnectGoogle = async () => {
    if (!user) return;
    try {
      const url = await getGoogleOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get Google OAuth URL.");
    }
  };

  const handleConnectNotion = async () => {
    if (!user) return;
    try {
      const url = await getNotionOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get Notion OAuth URL.");
    }
  };

  const handleConnectHubSpot = async () => {
    if (!user) return;
    try {
      const url = await getHubSpotOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get HubSpot OAuth URL.");
    }
  };

  const handleConnectSalesforce = async () => {
    if (!user) return;
    try {
      const url = await getSalesforceOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get Salesforce OAuth URL.");
    }
  };

  const handleConnectSlack = async () => {
    if (!user) return;
    try {
      const url = await getSlackOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get Slack OAuth URL.");
    }
  };

  const handleConnectAirtable = async () => {
    if (!user) return;
    try {
      const url = await getAirtableOAuthUrl({ userId: user._id });
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to get Airtable OAuth URL.");
    }
  };

  const handleSaveSheetId = async (
    integrationId: Id<"integrations">,
    sheetId: string,
  ) => {
    try {
      await updateIntegrationConfig({ integrationId, config: { sheetId } });
      toast.success("Google Sheet saved!");
    } catch (error) {
      toast.error("Failed to save Sheet ID.");
    }
  };

  const handleSaveNotionDatabaseId = async (
    integrationId: Id<"integrations">,
    dbId: string,
  ) => {
    try {
      await updateIntegrationConfig({
        integrationId,
        config: { databaseId: dbId },
      });
      toast.success("Notion Database saved!");
    } catch (error) {
      toast.error("Failed to save Database ID.");
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration) return;

    try {
      await addIntegration({
        type: selectedIntegration.type,
        name: selectedIntegration.name,
        config: integrationConfig,
      });
      toast.success(`Successfully connected to ${selectedIntegration.name}`);
      setIntegrationModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to connect integration");
    }
  };

  const handleDisconnect = async (
    integrationId: Id<"integrations">,
    name: string,
  ) => {
    try {
      await deleteIntegration({ integrationId });
      toast.success(`Successfully disconnected from ${name}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect integration");
    }
  };

  // Return everything needed
  return {
    activeTabParam,
    integrations,
    links,
    open,
    isIntegrationModalOpen,
    notionDatabases,
    isFetchingDatabases,
    googleSheets,
    sheetId,
    notionDatabaseId,
    newWebhookUrl,
    webhooks,
    isFetchingSheets,
    selectedIntegration,
    integrationConfig,
    selectedEvents,
    setSelectedEvents,
    setIntegrationConfig,
    setSelectedIntegration,
    setNewWebhookUrl,
    setIntegrationModalOpen,
    setOpen,
    handleConnectClick,
    handleDisconnect,
    handleConnectGoogle,
    addWebhook,
    removeWebhook,
    handleSaveIntegration,
    handleSaveNotionDatabaseId,
    handleSaveSheetId,
    handleConnectAirtable,
    handleConnectNotion,
    handleConnectHubSpot,
    handleConnectSalesforce,
    handleConnectSlack,
  };
}
