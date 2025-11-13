"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import useIntegrations from "@/hooks/useIntegrations";
import { Preloaded } from "convex/react";
import {
  Copy,
  Plus,
  Trash2,
  Webhook,
  Code2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const availableEvents = [
  {
    id: "response.created",
    label: "Response Created",
    desc: "When a response starts",
  },
  {
    id: "response.updated",
    label: "Response Updated",
    desc: "When a response is edited",
  },
  {
    id: "response.completed",
    label: "Response Completed",
    desc: "When a response is submitted",
  },
];

type Props = {
  preloadedIntegrations: Preloaded<typeof api.integrations.getIntegrations>;
};

const WebhooksTab = ({ preloadedIntegrations }: Props) => {
  const {
    newWebhookUrl,
    webhooks,
    selectedEvents,
    setNewWebhookUrl,
    addWebhook,
    removeWebhook,
    setSelectedEvents,
  } = useIntegrations(preloadedIntegrations);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Webhook URL copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (webhooks === undefined) {
    return <WebhooksSkeleton />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 w-full max-w-5xl mx-auto"
    >
      {/* Add Webhook Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F56A4D]/10">
                <Webhook className="w-5 h-5 text-[#F56A4D]" />
              </div>
              <div>
                <CardTitle className="text-xl">Webhooks</CardTitle>
                <CardDescription>
                  Send form responses to your own endpoints
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Webhook */}
            <div className="space-y-4 p-5 rounded-xl border border-[#F56A4D]/20">
              <Label className="text-base font-semibold">Add New Webhook</Label>

              <div className="space-y-3">
                <Label className="text-sm">Events to send</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {availableEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEvents(
                          selectedEvents.includes(event.id)
                            ? selectedEvents.filter((e) => e !== event.id)
                            : [...selectedEvents, event.id],
                        );
                      }}
                    >
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => {}}
                        className="data-[state=checked]:bg-[#F56A4D] data-[state=checked]:border-[#F56A4D]"
                      />
                      <div>
                        <Label
                          htmlFor={event.id}
                          className="font-medium cursor-pointer"
                        >
                          {event.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {event.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="https://api.example.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="font-mono text-sm bg-background"
                />
                <Button
                  onClick={addWebhook}
                  disabled={!newWebhookUrl || selectedEvents.length === 0}
                  className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Webhook
                </Button>
              </div>
            </div>

            {/* Active Webhooks */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Active Webhooks ({webhooks.length})
              </Label>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No webhooks configured yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <motion.div
                      key={webhook._id}
                      layout
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-md">
                            {webhook.url}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(webhook.url, webhook._id)}
                          >
                            {copiedId === webhook._id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge
                              key={event}
                              variant="secondary"
                              className="text-xs font-mono"
                            >
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeWebhook(webhook._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Developer Guide */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F56A4D]/10">
                <Code2 className="w-5 h-5 text-[#F56A4D]" />
              </div>
              <div>
                <CardTitle className="text-xl">Developer Guide</CardTitle>
                <CardDescription>
                  How to receive and parse webhook payloads
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payload Example */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-[#F56A4D]" />
                Payload Structure
              </h4>
              <pre className="p-4 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono">
                <code>{`{
  "event": "response.completed",
  "form": { "id": "f12345", "title": "Customer Feedback" },
  "response": {
    "id": "r67890",
    "status": "completed",
    "submittedAt": 1678886400000,
    "answers": {
      "What is your name?": "John Doe",
      "How was your experience?": "Excellent!",
      "Rating": 5
    }
  },
  "timestamp": 1678886401000
}`}</code>
              </pre>
            </div>

            {/* Node.js Example */}
            <div>
              <h4 className="font-semibold mb-2">Node.js / Express Example</h4>
              <pre className="p-4 rounded-lg bg-muted/50 border text-xs overflow-x-auto font-mono">
                <code>{`app.post('/webhook', (req, res) => {
  const payload = req.body;
  console.log('Webhook:', payload.event);

  // Verify signature (recommended)
  // const signature = req.headers['candid-signature'];

  if (payload.event === 'response.completed') {
    // Save to DB, send Slack, etc.
  }

  res.status(200).send('OK');
});`}</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Use{" "}
                <code className="bg-muted px-1 rounded">candid-signature</code>{" "}
                header to verify requests.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Skeleton
function WebhooksSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export default WebhooksTab;
