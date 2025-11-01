"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Trash2, Plus, GripVertical, Loader2 } from "lucide-react"
import { mockForms, mockQuestions } from "@/lib/mock-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const QUESTION_TYPE_MAP: Record<string, string> = {
  "Short Text": "text",
  "Long Text": "textarea",
  Email: "email",
  Number: "number",
  "Multiple Choice": "choice",
  Checkboxes: "checkbox",
  Rating: "rating",
  Date: "date",
  Phone: "phone",
  File: "file",
};

function SortableQuestion({
  question,
  onUpdate,
  onDelete,
}: {
  question: any;
  onUpdate: (id: Id<"questions">, updates: any) => void;
  onDelete: (id: Id<"questions">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Local state for controlled inputs
  const [localText, setLocalText] = useState(question.text);
  const [localTypeLabel, setLocalTypeLabel] = useState(
    Object.entries(QUESTION_TYPE_MAP).find(([_, v]) => v === question.type)?.[0] ?? "Short Text"
  );

  useEffect(() => {
    setLocalText(question.text);
  }, [question.text]);

  useEffect(() => {
    const label = Object.entries(QUESTION_TYPE_MAP).find(([_, v]) => v === question.type)?.[0] ?? "Short Text";
    setLocalTypeLabel(label);
  }, [question.type]);

  return (
    <Card ref={setNodeRef} style={style} className="border-2">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-move"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Label>Question</Label>
                <Input
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  onBlur={(e) => {
                  const text = e.target.value;
                            if (text !== question.text) {
                    onUpdate(question._id, { text, type: question.type });
                  }
                  }}
                  placeholder="Enter your question"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onDelete(question._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={localTypeLabel}
                  onValueChange={(label) => {
  const type = QUESTION_TYPE_MAP[label];
  if (type !== question.type) {
    onUpdate(question._id, { 
      type,
      text: localText  // preserve current text
    });
  }
  setLocalTypeLabel(label);
}}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(QUESTION_TYPE_MAP).map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-8">
                <Label htmlFor={`required-${question._id}`}>Required</Label>
                <Switch
                  id={`required-${question._id}`}
                  defaultChecked={question.required}
                  onCheckedChange={(checked) =>
                    onUpdate(question._id, { required: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditFormPage({ params }: { params: { formId: Id<"forms"> } }) {
  const form = useQuery(api.forms.getSingleForm, { formId: params.formId });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"draft" | "published" | "closed">("draft");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [logoUrl, setLogoUrl] = useState("");
  const [emailOnResponse, setEmailOnResponse] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [personality, setPersonality] = useState<"professional" | "friendly" | "casual" | "formal">("professional");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Questions with sorting and optimistic state
  const rawQuestions = useQuery(api.questions.getFormQuestions, { formId: params.formId }) ?? [];
  const sortedQuestions = [...rawQuestions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [optimisticQuestions, setOptimisticQuestions] = useState<any[]>([]);

  useEffect(() => {
    setOptimisticQuestions(sortedQuestions);
  }, [JSON.stringify(sortedQuestions)]); // Deep compare for dependency

  const updateSettings = useMutation(api.forms.updateSettings);
  const createQ = useMutation(api.questions.createQuestion);
  const updateQ = useMutation(api.questions.updateQuestion);
  const deleteQ = useMutation(api.questions.deleteQuestion);
  const reorderQ = useMutation(api.questions.reorderQuestions);

  useEffect(() => {
    if (!form) return;
    setTitle(form.title ?? "");
    setDescription(form.description ?? "");
    setStatus(form.status ?? "draft");
    setPrimaryColor(form.settings?.branding?.primaryColor ?? "#6366f1");
    setLogoUrl(form.settings?.branding?.logoUrl ?? "");
    setEmailOnResponse(form.settings?.notifications?.emailOnResponse ?? false);
    setNotificationEmail(form.settings?.notifications?.notificationEmail ?? "");
    setPersonality(form.aiConfig?.personality ?? "professional");
    setVoiceEnabled(form.aiConfig?.enableVoice ?? false);
  }, [form]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        formId: params.formId,
        title,
        description,
        status,
        primaryColor,
        logoUrl,
        emailOnResponse,
        notificationEmail,
        personality,
        voiceEnabled,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Question CRUD ─────────────────────────────── */
  const addQuestion = async () => {
    const order = optimisticQuestions.length;
    const newQuestion = await createQ({
      formId: params.formId,
      type: "text",
      text: "New question",
      required: false,
      order,
    });
    // Optimistically add
    setOptimisticQuestions((prev) => [...prev, newQuestion]);
    toast.success("Question added");
  };

  const updateQuestion = async (id: Id<"questions">, updates: any) => {
    await updateQ({ questionId: id, ...updates });
  };

  const deleteQuestion = async (id: Id<"questions">) => {
    await deleteQ({ questionId: id });
    // Optimistically remove
    setOptimisticQuestions((prev) => prev.filter((q) => q._id !== id));
    toast.success("Question deleted");
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOptimisticQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q._id === active.id);
      const newIndex = prev.findIndex((q) => q._id === over.id);
      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // Update DB (fire and forget, but catch errors)
      reorderQ({
        formId: params.formId,
        questionIds: newOrder.map((q) => q._id),
      }).catch(() => {
        toast.error("Failed to reorder");
        // Optionally revert: return prev;
      });

      return newOrder;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Form</h1>
            <p className="text-muted-foreground">Customize your form questions and settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/f/${form?._id}`} target="_blank">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </Link>
          <Button className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Questions</CardTitle>
                  <CardDescription>Add, edit, or reorder your form questions</CardDescription>
                </div>
                <Button onClick={addQuestion} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={optimisticQuestions.map((q) => q._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {optimisticQuestions.map((question) => (
                      <SortableQuestion
                        key={question._id}
                        question={question}
                        onUpdate={updateQuestion}
                        onDelete={deleteQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <Label>Form Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Title & Description */}
              <div className="space-y-2">
                <Label htmlFor="title">Form Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              {/* ── Notifications ── */}
              <div className="space-y-4">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email on new response</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone submits
                    </p>
                  </div>
                  <Switch checked={emailOnResponse} onCheckedChange={setEmailOnResponse} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                  />
                </div>
              </div>
              {/* ── AI Config ── */}
              <div className="space-y-4">
                <h3 className="font-medium">AI Configuration</h3>
                <div className="space-y-2">
                  <Label htmlFor="personality">AI Personality</Label>
                  <Select value={personality} onValueChange={(v) => setPersonality(v as any)}>
                    <SelectTrigger id="personality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Input</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to speak their answers
                    </p>
                  </div>
                  <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
          {isSaving ? <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </> : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}