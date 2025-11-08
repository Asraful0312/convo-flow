"use client"

import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type NotionMappingProps = {
  form: {
    _id: Id<"forms">;
    questions: any[];
    integrationMappings?: {
      notion?: {
        databaseId: string;
        mapping: {
          questionId: string;
          notionPropertyId: string;
          notionPropertyName: string;
        }[];
      };
    };
  };
};

type NotionProperty = {
  id: string;
  name: string;
  type: string;
};

export default function NotionMapping({ form }: NotionMappingProps) {
  const router = useRouter();
  const notionIntegration = useQuery(api.integrations.getNotionIntegration);
  const getNotionDatabases = useAction(api.notion.getAccessibleDatabases);
  const getDbProperties = useAction(api.notion.getDatabaseProperties);
  const updateMapping = useMutation(api.forms.updateFormIntegrationMapping);

  const [databases, setDatabases] = useState<{ id: string; title: string }[]>([]);
  const [isFetchingDatabases, setIsFetchingDatabases] = useState(false);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [properties, setProperties] = useState<NotionProperty[]>([]);
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notionIntegration) {
      setIsFetchingDatabases(true);
      getNotionDatabases()
        .then(setDatabases)
        .catch(() => toast.error("Failed to fetch Notion databases"))
        .finally(() => setIsFetchingDatabases(false));
    }
  }, [notionIntegration, getNotionDatabases]);

  useEffect(() => {
    const notionMapping = form.integrationMappings?.notion;
    if (notionMapping?.databaseId) {
      setSelectedDb(notionMapping.databaseId);
      const initialMapping: { [key: string]: string } = {};
      notionMapping.mapping.forEach(m => {
        initialMapping[m.notionPropertyName] = m.questionId;
      });
      setFieldMapping(initialMapping);
    }
  }, [form.integrationMappings]);

  useEffect(() => {
    if (selectedDb) {
      setIsFetchingProperties(true);
      getDbProperties({ databaseId: selectedDb })
        .then(setProperties)
        .catch(() => toast.error("Failed to fetch database properties"))
        .finally(() => setIsFetchingProperties(false));
    } else {
      setProperties([]);
    }
  }, [selectedDb, getDbProperties]);

  const handleSaveMapping = async () => {
    if (!selectedDb) {
      toast.error("Please select a database first.");
      return;
    }
    setIsSaving(true);
    try {
      const mappingPayload = {
        databaseId: selectedDb,
        mapping: Object.entries(fieldMapping)
          .filter(([_, questionId]) => questionId) // Only include mapped fields
          .map(([notionPropertyName, questionId]) => ({
            questionId,
            notionPropertyName,
            notionPropertyId: properties.find(p => p.name === notionPropertyName)?.id || "",
          })),
      };
      await updateMapping({
        formId: form._id,
        integrationType: "notion",
        mapping: mappingPayload,
      });
      toast.success("Notion mapping saved successfully!");
    } catch (error) {
      toast.error("Failed to save Notion mapping.");
    } finally {
      setIsSaving(false);
    }
  };

  if (notionIntegration === undefined) {
    return <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!notionIntegration) {
    return (
      <div className="text-center">
        <p className="mb-4">The Notion integration is not connected.</p>
        <Button onClick={() => router.push('/dashboard/settings?selected=integrations')}>
          <Link className="w-4 h-4 mr-2" />
          Connect Notion
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notion Database Mapping</h3>
        <p className="text-sm text-muted-foreground">
          Map your form questions to the properties in your Notion database.
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="font-medium">Select Notion Database</label>
        <Select
          value={selectedDb ?? ""}
          onValueChange={setSelectedDb}
          disabled={isFetchingDatabases}
        >
          <SelectTrigger>
            <SelectValue placeholder={isFetchingDatabases ? "Loading databases..." : "Choose a database"} />
          </SelectTrigger>
          <SelectContent>
            {databases.map(db => (
              <SelectItem key={db.id} value={db.id}>{db.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFetchingProperties && (
        <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
      )}

      {properties.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>
                Select which form question should populate each Notion property. The first question of your form will be used for the Notion entry's title if it's not mapped below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {properties.map(prop => (
                <div key={prop.id} className="grid grid-cols-2 gap-4 items-center">
                  <div className="font-medium">{prop.name} <span className="text-xs text-muted-foreground">({prop.type})</span></div>
                  <Select
                    value={fieldMapping[prop.name] || ""}
                    onValueChange={(value) => {
                      const newValue = value === "UNMAPPED" ? "" : value;
                      setFieldMapping(prev => ({ ...prev, [prop.name]: newValue }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNMAPPED">-- Unmapped --</SelectItem>
                      {form.questions.map(q => (
                        <SelectItem key={q._id} value={q._id}>{q.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSaveMapping} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Mapping
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
