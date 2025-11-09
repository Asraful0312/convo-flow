"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Zap,
  Shield,
  Webhook,
  Check,
  Copy,
  Plus,
  Trash2,
  Loader2,
  UserCog,
  CreditCard,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import ProfileSection from "@/components/settings/profile-section";
import BillingSection from "@/components/settings/billing-section";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Preloaded,
  useAction,
  useMutation,
  usePreloadedQuery,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HighlightedTitle } from "../HighlightedTitle";
import { motion } from "framer-motion";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Logo } from "../settings/logo";
import { LogoIcon } from "../settings/logo-icon";

type Props = {
  preloadedIntegrations: Preloaded<typeof api.integrations.getIntegrations>;
};

// Animation variants for the container and items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

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
];

export default function SettingsContent({ preloadedIntegrations }: Props) {
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

  const [webhooks, setWebhooks] = useState([
    {
      id: "1",
      url: "https://api.example.com/webhook",
      events: ["response.created", "response.completed"],
    },
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");

  const { signOut } = useAuthActions();
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
      (userInt) => userInt.type === availInt.type,
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

  const addWebhook = () => {
    if (newWebhookUrl.trim()) {
      setWebhooks([
        ...webhooks,
        {
          id: Date.now().toString(),
          url: newWebhookUrl,
          events: ["response.created"],
        },
      ]);
      setNewWebhookUrl("");
    }
  };

  const removeWebhook = (id: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
  };

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-7xl mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          {user && (
            <div>
              <SidebarLink
                link={{
                  label: user.name || "User",
                  href: "#",
                  icon: user?.image ? (
                    <Image
                      src={user?.image}
                      className="h-7 w-7 shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ) : (
                    <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
                  ),
                }}
              />
            </div>
          )}
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 h-full">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
          {activeTabParam === "profile" && (
            <div className="space-y-6 w-full">
              <ProfileSection />

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <CardTitle>Security</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="bg-background"
                    />
                  </div>
                  <Button className="bg-[#6366f1] hover:bg-[#4f46e5]">
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Button onClick={signOut} variant="secondary" className="w-full">
                Sign Out
              </Button>
            </div>
          )}

          {activeTabParam === "notifications" && (
            <div className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    <CardTitle>Email Notifications</CardTitle>
                  </div>
                  <CardDescription>
                    Choose what emails you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone submits a form
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Summary</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your form performance
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Product Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new features and updates
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive tips and best practices
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTabParam === "integrations" && (
            <div className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  {/* Header Section */}
                  <div className="grid grid-cols-1 items-start gap-x-12 gap-y-10 lg:grid-cols-2">
                    <div className="max-w-xl">
                      <HighlightedTitle text="Connect your ~favorite~ tools" />
                      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                        Save time using popular integrations to sync your form
                        submissions.
                      </p>
                    </div>
                    <div className="flex items-center justify-center lg:justify-center">
                      <img
                        src="https://tally.so/images/demo/v2/strategy.png"
                        alt="a person working "
                        className="w-64 h-auto object-contain"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2"
                    variants={containerVariants as any}
                    initial="hidden"
                    animate="visible" // Can be changed to whileInView for scroll-triggered animation
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    {integrations.map((integration) => {
                      if (integration.type === "zapier") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">
                                <img
                                  src={integration.iconSrc}
                                  alt={`${integration.name} logo`}
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                              <div>
                                <div className="flex items-center flex-wrap gap-2">
                                  <h4 className="font-semibold">
                                    {integration.name}
                                  </h4>
                                  {integration.connected && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <Check className="w-3 h-3 mr-1" />
                                      Connected
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {integration.description}
                                </p>
                              </div>
                            </div>
                            {integration.connected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDisconnect(
                                    integration.id!,
                                    integration.name,
                                  )
                                }
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                onClick={() => handleConnectClick(integration)}
                              >
                                Connect
                              </Button>
                            )}
                          </motion.div>
                        );
                      }
                      if (integration.type === "hubspot") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0">
                                  <img
                                    src={integration.iconSrc}
                                    alt={`${integration.name} logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {integration.name}
                                    </h4>
                                    {integration.connected && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnect(
                                      integration.id!,
                                      integration.name,
                                    )
                                  }
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                  onClick={handleConnectHubSpot}
                                >
                                  Connect HubSpot
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      }
                      if (integration.type === "google_sheets") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0">
                                  <img
                                    src={integration.iconSrc}
                                    alt={`${integration.name} logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {integration.name}
                                    </h4>
                                    {integration.connected && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnect(
                                      integration.id!,
                                      integration.name,
                                    )
                                  }
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                  onClick={handleConnectGoogle}
                                >
                                  Connect Google Account
                                </Button>
                              )}
                            </div>
                            {integration.connected && (
                              <div className="space-y-2 pl-13">
                                <Select
                                  value={sheetId}
                                  onValueChange={(id) => {
                                    setSheetId(id);
                                    handleSaveSheetId(integration.id!, id);
                                  }}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue
                                      placeholder={
                                        isFetchingSheets
                                          ? "Loading sheets..."
                                          : "Select a sheet..."
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isFetchingSheets ? (
                                      <div className="flex items-center justify-center p-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      </div>
                                    ) : (
                                      googleSheets.map((sheet) => (
                                        <SelectItem
                                          key={sheet.id}
                                          value={sheet.id}
                                        >
                                          {sheet.title}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                      if (integration.type === "airtable") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0">
                                  <img
                                    src={integration.iconSrc}
                                    alt={`${integration.name} logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {integration.name}
                                    </h4>
                                    {integration.connected && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnect(
                                      integration.id!,
                                      integration.name,
                                    )
                                  }
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                  onClick={handleConnectAirtable}
                                >
                                  Connect Airtable
                                </Button>
                              )}
                            </div>
                            {integration.connected && (
                              <div className="pl-13">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleConnectClick(integration)
                                  }
                                >
                                  Set Base & Table IDs
                                </Button>
                                {integration.config?.baseId &&
                                  integration.config?.tableId && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Configured for Base ID: ...
                                      {integration.config.baseId.slice(-4)}
                                    </p>
                                  )}
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                      if (integration.type === "notion") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0">
                                  <img
                                    src={integration.iconSrc}
                                    alt={`${integration.name} logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {integration.name}
                                    </h4>
                                    {integration.connected && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnect(
                                      integration.id!,
                                      integration.name,
                                    )
                                  }
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                  onClick={handleConnectNotion}
                                >
                                  Connect Notion Account
                                </Button>
                              )}
                            </div>
                            {integration.connected && (
                              <div className="space-y-2 pl-13">
                                <Select
                                  value={notionDatabaseId}
                                  onValueChange={(dbId) => {
                                    setNotionDatabaseId(dbId);
                                    handleSaveNotionDatabaseId(
                                      integration.id!,
                                      dbId,
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue
                                      placeholder={
                                        isFetchingDatabases
                                          ? "Loading databases..."
                                          : "Select a database..."
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isFetchingDatabases ? (
                                      <div className="flex items-center justify-center p-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      </div>
                                    ) : (
                                      notionDatabases.map((db) => (
                                        <SelectItem key={db.id} value={db.id}>
                                          {db.title}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Pro Tip: Ensure your Notion property names
                                  match your form questions for a perfect sync.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      }
                      if (integration.type === "slack") {
                        return (
                          <motion.div
                            key={integration.name}
                            variants={itemVariants as any}
                            className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0">
                                  <img
                                    src={integration.iconSrc}
                                    alt={`${integration.name} logo`}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {integration.name}
                                    </h4>
                                    {integration.connected && (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Check className="w-3 h-3 mr-1" />
                                        Connected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDisconnect(
                                      integration.id!,
                                      integration.name,
                                    )
                                  }
                                >
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-[#6366f1] hover:bg-[#4f46e5]"
                                  onClick={handleConnectSlack}
                                >
                                  Connect Slack
                                </Button>
                              )}
                            </div>
                            {integration.connected &&
                              integration.config?.incomingWebhook?.channel && (
                                <div className="pl-13">
                                  <p className="text-sm text-muted-foreground">
                                    Connected to channel:{" "}
                                    <span className="font-semibold">
                                      {
                                        integration.config.incomingWebhook
                                          .channel
                                      }
                                    </span>
                                  </p>
                                </div>
                              )}
                          </motion.div>
                        );
                      }
                    })}
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTabParam === "webhooks" && (
            <div className="space-y-6 w-full">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    <CardTitle>Webhooks</CardTitle>
                  </div>
                  <CardDescription>
                    Send form responses to your own endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Add New Webhook</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://api.example.com/webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="bg-background"
                      />
                      <Button
                        onClick={addWebhook}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Active Webhooks</Label>
                    {webhooks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No webhooks configured
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {webhooks.map((webhook) => (
                          <div
                            key={webhook.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {webhook.url}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                {webhook.events.map((event) => (
                                  <Badge
                                    key={event}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {event}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWebhook(webhook.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-semibold mb-2">Available Events</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • response.created - When a new response is started
                      </li>
                      <li>• response.updated - When a response is updated</li>
                      <li>
                        • response.completed - When a response is completed
                      </li>
                      <li>• form.published - When a form is published</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTabParam === "billing" && (
            <div className="w-full">
              <BillingSection />
            </div>
          )}
        </div>
      </div>

      {selectedIntegration && selectedIntegration.type !== "google_sheets" && (
        <Dialog
          open={isIntegrationModalOpen}
          onOpenChange={setIntegrationModalOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect to {selectedIntegration.name}</DialogTitle>
              <DialogDescription>
                Follow the instructions below to find your credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-md bg-muted/80 text-sm">
                <p className="font-semibold mb-2">Instructions:</p>
                <p className="text-muted-foreground">
                  {selectedIntegration.instructions}
                </p>
              </div>
              {selectedIntegration.fields.map((field: any) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={integrationConfig[field.name] || ""}
                    onChange={(e) =>
                      setIntegrationConfig({
                        ...integrationConfig,
                        [field.name]: e.target.value,
                      })
                    }
                    className="bg-background"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIntegrationModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveIntegration}
                className="bg-[#6366f1] hover:bg-[#4f46e5]"
              >
                Save & Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
