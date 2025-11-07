"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {Bell, Zap, Shield, Webhook, Check, Copy, Plus, Trash2 } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"
import ProfileSection from "@/components/settings/profile-section"
import BillingSection from "@/components/settings/billing-section"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"


const availableIntegrations = [
    {
      name: "Zapier",
      type: "zapier",
      description: "Connect to 5,000+ apps",
      icon: "⚡",
      color: "bg-orange-100 dark:bg-orange-900/30",
      fields: [{ name: "webhookUrl", label: "Webhook URL", type: "text" }],
      instructions: "1. Create a new Zap. 2. Choose 'Webhooks by Zapier' as the trigger. 3. Copy the webhook URL and paste it here.",
    },
    {
      name: "Slack",
      type: "slack",
      description: "Get notifications in Slack",
      icon: "💬",
      color: "bg-purple-100 dark:bg-purple-900/30",
      fields: [{ name: "webhookUrl", label: "Incoming Webhook URL", type: "text" }],
      instructions: "1. Go to your Slack app settings. 2. Create a new Incoming Webhook. 3. Copy the webhook URL and paste it here.",
    },
    {
      name: "Google Sheets",
      type: "google_sheets",
      description: "Export responses automatically",
      icon: "📊",
      color: "bg-green-100 dark:bg-green-900/30",
      fields: [], // Fields are now handled by OAuth
      instructions: "1. Connect your Google Account. 2. Paste the ID of the Google Sheet you want to sync to.",
    },
    {
      name: "HubSpot",
      type: "hubspot",
      description: "Sync leads to your CRM",
      icon: "🎯",
      color: "bg-blue-100 dark:bg-blue-900/30",
      fields: [{ name: "apiKey", label: "API Key", type: "password" }],
      instructions: "1. In your HubSpot account, go to Settings > Integrations > API Key. 2. Generate a new API key and copy it here.",
    },
    {
      name: "Airtable",
      type: "airtable",
      description: "Store responses in Airtable",
      icon: "🗂️",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
      fields: [{ name: "apiKey", label: "API Key", type: "password" }, { name: "baseId", label: "Base ID", type: "text" }, { name: "tableId", label: "Table ID", type: "text" }],
      instructions: "1. Go to your Airtable account settings to find your API key. 2. Find the Base ID and Table ID in the API documentation for your base.",
    },
    {
      name: "Notion",
      type: "notion",
      description: "Add responses to Notion",
      icon: "📝",
      color: "bg-gray-100 dark:bg-gray-800",
      fields: [{ name: "apiKey", label: "Internal Integration Token", type: "password" }, { name: "databaseId", label: "Database ID", type: "text" }],
      instructions: "1. Create a new internal integration in Notion. 2. Share your database with the integration. 3. Copy the token and database ID here.",
    },
]

export default function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter()
    const activeTabParam = searchParams.get("selected");

    const [webhooks, setWebhooks] = useState([
        { id: "1", url: "https://api.example.com/webhook", events: ["response.created", "response.completed"] },
    ])
    const [newWebhookUrl, setNewWebhookUrl] = useState("")

    const { signOut } = useAuthActions()
    const user = useQuery(api.auth.loggedInUser);
    const billingInfo = useQuery(api.billing.getBillingInfo)
    const userIntegrations = useQuery(api.integrations.getIntegrations)
    const addIntegration = useMutation(api.integrations.addIntegration)
    const deleteIntegration = useMutation(api.integrations.deleteIntegration)
    const updateIntegrationConfig = useMutation(api.integrations.updateIntegrationConfig)
    const getGoogleOAuthUrl = useAction(api.google.getOAuthUrl);


    const [isIntegrationModalOpen, setIntegrationModalOpen] = useState(false)
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
    const [integrationConfig, setIntegrationConfig] = useState<any>({})
    const [sheetId, setSheetId] = useState("");

    const integrations = availableIntegrations.map(availInt => {
        const connectedInt = userIntegrations?.find(userInt => userInt.type === availInt.type)
        return {
            ...availInt,
            connected: !!connectedInt,
            id: connectedInt?._id,
            config: connectedInt?.config,
        }
    })

    useEffect(() => {
  const googleSheetsIntegration = integrations.find(int => int.type === "google_sheets");
  if (
    googleSheetsIntegration &&
    googleSheetsIntegration.connected &&
    !sheetId // only set if it's empty (avoid overwriting user typing)
  ) {
    setSheetId(googleSheetsIntegration.config?.sheetId || "");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [integrations]);


    const handleConnectClick = (integration: any) => {
        if (billingInfo?.tier === 'free') {
            toast.error("Integrations are only available on Pro and Business plans. Please upgrade your plan.", {
                action: {
                    label: "Upgrade",
                    onClick: () => router.push('/dashboard/pricing'),
                },
            })
            return
        }
        setSelectedIntegration(integration)
        setIntegrationConfig({})
        setIntegrationModalOpen(true)
    }

    const handleConnectGoogle = async () => {
        if (!user) return;
        try {
            const url = await getGoogleOAuthUrl({ userId: user._id });
            window.location.href = url;
        } catch (error) {
            toast.error("Failed to get Google OAuth URL.");
        }
    };

    const handleSaveSheetId = async (integrationId: Id<"integrations">) => {
        try {
            await updateIntegrationConfig({ integrationId, config: { sheetId } });
            toast.success("Google Sheet ID saved!");
        } catch (error) {
            toast.error("Failed to save Sheet ID.");
        }
    };

    const handleSaveIntegration = async () => {
        if (!selectedIntegration) return

        try {
            await addIntegration({
                type: selectedIntegration.type,
                name: selectedIntegration.name,
                config: integrationConfig,
            })
            toast.success(`Successfully connected to ${selectedIntegration.name}`)
            setIntegrationModalOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Failed to connect integration")
        }
    }

    const handleDisconnect = async (integrationId: Id<"integrations">, name: string) => {
        try {
            await deleteIntegration({ integrationId })
            toast.success(`Successfully disconnected from ${name}`)
        } catch (error: any) {
            toast.error(error.message || "Failed to disconnect integration")
        }
    }

    const addWebhook = () => {
        if (newWebhookUrl.trim()) {
            setWebhooks([
                ...webhooks,
                {
                    id: Date.now().toString(),
                    url: newWebhookUrl,
                    events: ["response.created"],
                },
            ])
            setNewWebhookUrl("")
        }
    }

    const removeWebhook = (id: string) => {
        setWebhooks(webhooks.filter((w) => w.id !== id))
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <Tabs value={activeTabParam || "profile"} onValueChange={(val) => router.push(`/dashboard/settings?selected=${val}`)} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <ProfileSection />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                <CardTitle>Security</CardTitle>
                            </div>
                            <CardDescription>Manage your password and security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" className="bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" className="bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" className="bg-background" />
                            </div>
                            <Button className="bg-[#6366f1] hover:bg-[#4f46e5]">Update Password</Button>
                        </CardContent>
                    </Card>

                    <Button onClick={signOut} variant="secondary" className="w-full">Sign Out</Button>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                <CardTitle>Email Notifications</CardTitle>
                            </div>
                            <CardDescription>Choose what emails you want to receive</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>New Responses</Label>
                                    <p className="text-sm text-muted-foreground">Get notified when someone submits a form</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Summary</Label>
                                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your form performance</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Product Updates</Label>
                                    <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Marketing Emails</Label>
                                    <p className="text-sm text-muted-foreground">Receive tips and best practices</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                <CardTitle>Integrations</CardTitle>
                            </div>
                            <CardDescription>Connect Candid with your favorite tools</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4">
                                {integrations.map((integration) => {
                                    if (integration.type === 'google_sheets') {
                                        return (
                                            <div key={integration.name} className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-xl`}>{integration.icon}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold">{integration.name}</h4>
                                                                {integration.connected && (
                                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                        <Check className="w-3 h-3 mr-1" />
                                                                        Connected
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                                                        </div>
                                                    </div>
                                                    {integration.connected ? (
                                                        <Button variant="outline" size="sm" onClick={() => handleDisconnect(integration.id!, integration.name)}>Disconnect</Button>
                                                    ) : (
                                                        <Button variant="default" size="sm" className="bg-[#6366f1] hover:bg-[#4f46e5]" onClick={handleConnectGoogle}>Connect Google Account</Button>
                                                    )}
                                                </div>
                                                {integration.connected && (
                                                    <div className="flex items-center gap-2 pl-13">
                                                        <Input
                                                            placeholder="Enter Google Sheet ID"
                                                            value={sheetId}
                                                            onChange={(e) => setSheetId(e.target.value)}
                                                            className="bg-background"
                                                        />
                                                        <Button size="sm" onClick={() => handleSaveSheetId(integration.id!)}>Save</Button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div
                                            key={integration.name}
                                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-[#6366f1] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-xl`}>{integration.icon}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">{integration.name}</h4>
                                                        {integration.connected && (
                                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                <Check className="w-3 h-3 mr-1" />
                                                                Connected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                                                </div>
                                            </div>
                                            {integration.connected ? (
                                                <Button variant="outline" size="sm" onClick={() => handleDisconnect(integration.id!, integration.name)}>Disconnect</Button>
                                            ) : (
                                                <Button variant="default" size="sm" className="bg-[#6366f1] hover:bg-[#4f46e5]" onClick={() => handleConnectClick(integration)}>Connect</Button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Webhook className="w-5 h-5" />
                                <CardTitle>Webhooks</CardTitle>
                            </div>
                            <CardDescription>Send form responses to your own endpoints</CardDescription>
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
                                    <Button onClick={addWebhook} className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Active Webhooks</Label>
                                {webhooks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No webhooks configured</p>
                                ) : (
                                    <div className="space-y-3">
                                        {webhooks.map((webhook) => (
                                            <div
                                                key={webhook.id}
                                                className="flex items-center justify-between p-4 rounded-lg border border-border"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{webhook.url}</code>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {webhook.events.map((event) => (
                                                            <Badge key={event} variant="secondary" className="text-xs">
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
                                    <li>• response.created - When a new response is started</li>
                                    <li>• response.updated - When a response is updated</li>
                                    <li>• response.completed - When a response is completed</li>
                                    <li>• form.published - When a form is published</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing">
                    <BillingSection />
                </TabsContent>
            </Tabs>

            {selectedIntegration && selectedIntegration.type !== 'google_sheets' && (
                <Dialog open={isIntegrationModalOpen} onOpenChange={setIntegrationModalOpen}>
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
                                <p className="text-muted-foreground">{selectedIntegration.instructions}</p>
                            </div>
                            {selectedIntegration.fields.map((field: any) => (
                                <div key={field.name} className="space-y-2">
                                    <Label htmlFor={field.name}>{field.label}</Label>
                                    <Input
                                        id={field.name}
                                        type={field.type}
                                        value={integrationConfig[field.name] || ""}
                                        onChange={(e) => setIntegrationConfig({ ...integrationConfig, [field.name]: e.target.value })}
                                        className="bg-background"
                                    />
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIntegrationModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveIntegration} className="bg-[#6366f1] hover:bg-[#4f46e5]">Save & Connect</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
