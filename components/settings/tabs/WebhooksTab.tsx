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
import { Copy, Plus, Trash2, Webhook } from "lucide-react";
import React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const availableEvents = [
  { id: "response.created", label: "Response Created" },
  { id: "response.updated", label: "Response Updated" },
  { id: "response.completed", label: "Response Completed" },
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

  return (
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
            <div className="space-y-2">
              <Label>Events to send</Label>
              <div className="flex flex-wrap gap-4">
                {availableEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEvents([...selectedEvents, event.id]);
                        } else {
                          setSelectedEvents(
                            selectedEvents.filter((e) => e !== event.id),
                          );
                        }
                      }}
                    />
                    <Label htmlFor={event.id} className="font-normal">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://api.example.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="bg-background"
              />
              <Button
                onClick={() => addWebhook()}
                className="bg-[#F56A4D] hover:bg-[#F56A4D] gap-2"
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
                    key={webhook._id}
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
                          onClick={() =>
                            navigator.clipboard.writeText(webhook.url)
                          }
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
                      onClick={() => removeWebhook(webhook._id)}
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
            </ul>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Developer Guide: Using Webhooks</CardTitle>
          <CardDescription>
            Here is how to receive and parse data from Candid webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Payload Structure</h4>
            <p className="text-sm text-muted-foreground">
              When an event you have subscribed to occurs, we will send a POST
              request to your webhook URL with the following JSON payload:
            </p>
            <pre className="mt-2 p-4 rounded-lg bg-muted/50 border border-border text-xs overflow-x-auto">
              <code>
                {`{
  "event": "response.completed",
  "form": {
    "id": "f12345",
    "title": "Customer Feedback"
  },
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
}`}
              </code>
            </pre>
          </div>
          <div>
            <h4 className="font-semibold">Example: Node.js/Express Server</h4>
            <p className="text-sm text-muted-foreground">
              Here is a simple example of how you can set up an Express server
              to listen for and handle incoming webhooks.
            </p>
            <pre className="mt-2 p-4 rounded-lg bg-muted/50 border border-border text-xs overflow-x-auto">
              <code>
                {`const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Use body-parser middleware to parse JSON
app.use(bodyParser.json());

// Define your webhook endpoint
app.post('/webhook-receiver', (req, res) => {
  const payload = req.body;

  console.log('Received webhook payload:');
  console.log(JSON.stringify(payload, null, 2));

  // Add your custom logic here
  // For example, save data to a database, send an email, etc.
  // const { event, form, response } = payload;
  // if (event === 'response.completed') {
  //   // Handle the completed response
  // }

  // Send a 200 OK response to acknowledge receipt
  res.status(200).send('Webhook received');
});

app.listen(port, () => {
  console.log(\`Server listening at http://localhost:\${port}\`);
});`}
              </code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksTab;
