"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import IntegrationCard from "../integrations/IntegrationCard";
import useIntegrations from "@/hooks/useIntegrations";
import { HighlightedTitle } from "@/components/HighlightedTitle";
import { Preloaded } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

type Props = {
  preloadedIntegrations: Preloaded<typeof api.integrations.getIntegrations>;
};

export default function IntegrationsTab({ preloadedIntegrations }: Props) {
  const {
    integrations,
    handleConnectClick,
    handleDisconnect,
    handleConnectGoogle,
    handleConnectNotion,
    handleConnectHubSpot,
    handleConnectSlack,
    handleConnectAirtable,
    handleSaveSheetId,
    handleSaveNotionDatabaseId,
    handleSaveIntegration,
    handleConnectSalesforce,
    sheetId,
    notionDatabaseId,
    googleSheets,
    notionDatabases,
    isFetchingSheets,
    isFetchingDatabases,
    selectedIntegration,
    integrationConfig,
    setIntegrationConfig,
    isIntegrationModalOpen,
    setIntegrationModalOpen,
  } = useIntegrations(preloadedIntegrations);

  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <HighlightedTitle text="Connect your ~favorite~ tools" />
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Save time using popular integrations to sync your form
                submissions.
              </p>
            </div>
            <img
              src="https://tally.so/images/demo/v2/strategy.png"
              alt="Person working on integrations"
              className="w-64 h-auto object-contain justify-self-center lg:justify-self-end"
            />
          </div>
        </CardHeader>

        <CardContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2"
          >
            {integrations.map((int) => {
              const isConnected = int.connected;

              return (
                <IntegrationCard
                  key={int.type}
                  integration={int}
                  onConnect={() => {
                    if (int.type === "google_sheets") handleConnectGoogle();
                    else if (int.type === "notion") handleConnectNotion();
                    else if (int.type === "hubspot") handleConnectHubSpot();
                    else if (int.type === "salesforce")
                      handleConnectSalesforce();
                    else if (int.type === "slack") handleConnectSlack();
                    else if (int.type === "airtable") handleConnectAirtable();
                    else handleConnectClick(int);
                  }}
                  onDisconnect={() => handleDisconnect(int.id!, int.name)}
                >
                  {/* Google Sheets: Show dropdown */}
                  {int.type === "google_sheets" && isConnected && (
                    <div className="pl-13 space-y-3 mt-3">
                      <Select
                        value={sheetId}
                        onValueChange={(id) => handleSaveSheetId(int.id!, id)}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue
                            placeholder={
                              isFetchingSheets
                                ? "Loading sheets..."
                                : "Select a Google Sheet"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {isFetchingSheets ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          ) : googleSheets.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-2">
                              No sheets found. Make sure you shared access.
                            </p>
                          ) : (
                            googleSheets.map((sheet) => (
                              <SelectItem key={sheet.id} value={sheet.id}>
                                {sheet.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {sheetId && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Synced to selected sheet
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notion: Show database selector */}
                  {int.type === "notion" && isConnected && (
                    <div className="pl-13 space-y-3 mt-3">
                      <Select
                        value={notionDatabaseId}
                        onValueChange={(dbId) =>
                          handleSaveNotionDatabaseId(int.id!, dbId)
                        }
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue
                            placeholder={
                              isFetchingDatabases
                                ? "Loading databases..."
                                : "Select a database"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {isFetchingDatabases ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          ) : notionDatabases.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-2">
                              No databases shared. Share one with the
                              integration.
                            </p>
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
                        Pro Tip: Match Notion property names with your form
                        questions.
                      </p>
                    </div>
                  )}

                  {/* Airtable: Show config button */}
                  {int.type === "airtable" && isConnected && (
                    <div className="pl-13 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConnectClick(int)}
                      >
                        {int.config?.baseId && int.config?.tableId
                          ? "Update Base & Table"
                          : "Set Base & Table IDs"}
                      </Button>
                      {int.config?.baseId && int.config?.tableId && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Configured for Base ID: ...
                          {int.config.baseId.slice(-4)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Slack: Show connected channel */}
                  {int.type === "slack" &&
                    isConnected &&
                    int.config?.incomingWebhook?.channel && (
                      <div className="pl-13 mt-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {int.config.incomingWebhook.channel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Notifications will be sent here
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Zapier: Show webhook URL if connected */}
                  {int.type === "zapier" &&
                    isConnected &&
                    int.config?.webhookUrl && (
                      <div className="pl-13 mt-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {int.config.webhookUrl}
                        </code>
                      </div>
                    )}
                </IntegrationCard>
              );
            })}
          </motion.div>
        </CardContent>
      </Card>

      {selectedIntegration && selectedIntegration.type !== "google_sheets" && (
        <Dialog
          open={isIntegrationModalOpen}
          onOpenChange={setIntegrationModalOpen}
        >
          <DialogContent className="h-full overflow-y-auto">
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
                className="bg-[#F56A4D] hover:bg-[#F56A4D]"
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
