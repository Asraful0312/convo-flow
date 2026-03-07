"use client";
import NotionMapping from "@/components/form/notion-mapping";
import SortableQuestion from "@/components/sortable-questions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Lock,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export default function EditFormPage({
  params,
}: {
  params: { formId: Id<"forms"> };
}) {
  const { formId } = use<any>(params as any);
  const router = useRouter();
  const form = useQuery(api.forms.getSingleForm, { formId: formId });
  const user = useQuery(api.auth.loggedInUser);
  const userRole = useQuery(
    api.users.getRole,
    form?.workspaceId ? { workspaceId: form.workspaceId } : "skip",
  );
  const isFreePlan =
    user?.subscriptionTier === "free" || !user?.subscriptionTier;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Redirect viewers - they cannot edit forms
  useEffect(() => {
    if (userRole === "viewer") {
      router.push(`/dashboard`);
    }
  }, [userRole, formId, router]);

  // Local Storage State for Backup
  const [localState, setLocalState] = useLocalStorage(
    `candid-form-edit-${formId}`,
    {
      title: "",
      description: "",
      status: "draft",
      primaryColor: "#f56a4d",
      secondaryColor: "#2EB7A7",
      backgroundColor: "#ffffff",
      font: "Inter",
      logoUrl: "",
      emailOnResponse: false,
      notificationEmail: "",
      personality: "professional",
      voiceEnabled: false,
      allowSaveAndResume: false,
      updatedAt: 0,
    },
  );

  // Form State
  const [status, setStatus] = useState<"draft" | "published" | "closed">(
    "draft",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f56a4d");
  const [secondaryColor, setSecondaryColor] = useState("#2EB7A7");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [font, setFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");
  const [emailOnResponse, setEmailOnResponse] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [personality, setPersonality] = useState<
    "professional" | "friendly" | "casual" | "formal"
  >("professional");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [allowSaveAndResume, setAllowSaveAndResume] = useState(false);

  // Debounced values for autosave
  const [debouncedTitle] = useDebounce(title, 1000);
  const [debouncedDescription] = useDebounce(description, 1000);

  // Memoize the settings object to prevent useDebounce from triggering on every render
  const settingsObject = {
    status,
    primaryColor,
    secondaryColor,
    backgroundColor,
    font,
    logoUrl,
    emailOnResponse,
    notificationEmail,
    personality,
    voiceEnabled,
    allowSaveAndResume,
  };

  const [debouncedSettings] = useDebounce(settingsObject, 1000, {
    equalityFn: (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
  });

  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Questions with sorting and optimistic state
  const rawQuestions =
    useQuery(api.questions.getFormQuestions, { formId: formId }) ?? [];
  const sortedQuestions = [...rawQuestions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const [optimisticQuestions, setOptimisticQuestions] = useState<any[]>([]);

  useEffect(() => {
    setOptimisticQuestions(sortedQuestions);
  }, [JSON.stringify(sortedQuestions)]); // Deep compare for dependency

  const updateSettings = useMutation(api.forms.updateSettings);
  const createQ = useMutation(api.questions.createQuestion);
  const updateQ = useMutation(api.questions.updateQuestion);
  const deleteQ = useMutation(api.questions.deleteQuestion);
  const reorderQ = useMutation(api.questions.reorderQuestions);

  // Sync to Local Storage - only after initial DB sync
  useEffect(() => {
    // Don't save to localStorage on initial mount or before form loads
    // This prevents saving empty title/description before DB data initializes
    if (isInitialMount.current || !form || !title) return;

    setLocalState({
      title,
      description,
      status: status as any,
      primaryColor,
      secondaryColor,
      backgroundColor,
      font,
      logoUrl,
      emailOnResponse,
      notificationEmail,
      personality,
      voiceEnabled,
      allowSaveAndResume,
      updatedAt: Date.now(),
    });
  }, [
    title,
    description,
    status,
    primaryColor,
    secondaryColor,
    backgroundColor,
    font,
    logoUrl,
    emailOnResponse,
    notificationEmail,
    personality,
    voiceEnabled,
    allowSaveAndResume,
    form,
  ]);

  // Autosave Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!form) return;

    const hasChanges =
      title !== (form.title ?? "") ||
      description !== (form.description ?? "") ||
      status !== (form.status ?? "draft") ||
      primaryColor !== (form.settings?.branding?.primaryColor ?? "#f56a4d") ||
      secondaryColor !==
        (form.settings?.branding?.secondaryColor ?? "#2EB7A7") ||
      backgroundColor !==
        (form.settings?.branding?.backgroundColor ?? "#ffffff") ||
      font !== (form.settings?.branding?.font ?? "Inter") ||
      logoUrl !== (form.settings?.branding?.logoUrl ?? "") ||
      emailOnResponse !==
        (form.settings?.notifications?.emailOnResponse ?? false) ||
      notificationEmail !==
        (form.settings?.notifications?.notificationEmail ?? "") ||
      personality !== (form.aiConfig?.personality ?? "professional") ||
      voiceEnabled !== (form.aiConfig?.enableVoice ?? false) ||
      allowSaveAndResume !== (form.settings?.allowSaveAndResume ?? false);

    if (hasChanges) {
      handleSaveSettings(true);
    }
  }, [debouncedTitle, debouncedDescription, debouncedSettings]);

  // Initialize from Form Data or Local Storage
  useEffect(() => {
    if (!form) return;

    // Check if local storage has newer data (only for editors/admins)
    if (
      localState.updatedAt > (form.updatedAt || 0) &&
      localState.title &&
      userRole !== "viewer"
    ) {
      toast("We found unsaved changes from a previous session.", {
        action: {
          label: "Restore",
          onClick: () => {
            setTitle(localState.title);
            setDescription(localState.description);
            setStatus(localState.status as any);
            setPrimaryColor(localState.primaryColor);
            setSecondaryColor(localState.secondaryColor);
            setBackgroundColor(localState.backgroundColor);
            setFont(localState.font);
            setLogoUrl(localState.logoUrl);
            setEmailOnResponse(localState.emailOnResponse);
            setNotificationEmail(localState.notificationEmail);
            setPersonality(localState.personality as any);
            setVoiceEnabled(localState.voiceEnabled);
            setAllowSaveAndResume(localState.allowSaveAndResume);
            toast.success("Restored from local backup");
          },
        },
        duration: 10000, // Give them time to see it
      });
    } else {
      // Only sync from DB if we didn't restore (or if local isn't newer)
      setTitle(form.title ?? "");
      setDescription(form.description ?? "");
      setStatus(form.status ?? "draft");
      setPrimaryColor(form.settings?.branding?.primaryColor ?? "#f56a4d");
      setSecondaryColor(form.settings?.branding?.secondaryColor ?? "#2EB7A7");
      setBackgroundColor(form.settings?.branding?.backgroundColor ?? "#ffffff");
      setFont(form.settings?.branding?.font ?? "Inter");
      setLogoUrl(form.settings?.branding?.logoUrl ?? "");
      setEmailOnResponse(
        form.settings?.notifications?.emailOnResponse ?? false,
      );
      setNotificationEmail(
        form.settings?.notifications?.notificationEmail ?? "",
      );
      setPersonality(form.aiConfig?.personality ?? "professional");
      setVoiceEnabled(form.aiConfig?.enableVoice ?? false);
      setAllowSaveAndResume(form.settings?.allowSaveAndResume ?? false);
    }
  }, [form]);

  useEffect(() => {
    if (questionsContainerRef.current) {
      questionsContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [optimisticQuestions.length]);

  const handleSaveSettings = async (isAutosave = false) => {
    if (emailOnResponse && !notificationEmail.trim()) {
      if (!isAutosave) toast.error("A notification email must be provided.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        formId,
        title,
        description,
        status,
        emailOnResponse,
        notificationEmail,
        personality,
        voiceEnabled,
        allowSaveAndResume,
        primaryColor,
        secondaryColor,
        backgroundColor,
        font,
        logoUrl,
      };

      await updateSettings(payload);
      setLastSavedAt(new Date());
      if (!isAutosave) toast.success("Settings saved");
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err instanceof ConvexError ? err.data : "Failed to save";
      if (!isAutosave) toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

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
    try {
      await updateQ({ questionId: id, ...updates });
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Failed to update!",
      );
    }
  };

  const deleteQuestion = async (id: Id<"questions">) => {
    await deleteQ({ questionId: id });
    // Optimistically remove
    setOptimisticQuestions((prev) => prev.filter((q) => q._id !== id));
    toast.success("Question deleted");
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Form</h1>
            <p className="text-muted-foreground">
              Customize your form questions and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/f/${form?._id}`} target="_blank">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : lastSavedAt ? (
              <span>Saved {lastSavedAt.toLocaleTimeString()}</span>
            ) : null}
          </div>
          <Button
            onClick={() => handleSaveSettings(false)}
            className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="flex-wrap shrink grow h-fit">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Form Questions</CardTitle>
                  <CardDescription>
                    Add, edit, or reorder your form questions
                  </CardDescription>
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
                  <div ref={questionsContainerRef} className="space-y-4">
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
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as any)}
                >
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
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
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
                  <Switch
                    checked={emailOnResponse}
                    onCheckedChange={setEmailOnResponse}
                  />
                </div>

                {/* Global Notification Warning */}
                {emailOnResponse &&
                  user?.notifications?.emailOnResponse === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3">
                      <div className="text-amber-600 mt-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">
                          Notifications are globally disabled
                        </p>
                        <p className="mt-1">
                          You have disabled &quot;New Responses&quot; emails in
                          your{" "}
                          <Link
                            href="/dashboard/settings?selected=notifications"
                            className="underline hover:text-amber-900"
                          >
                            account settings
                          </Link>
                          . You won&apos;t receive emails even if this is
                          enabled.
                        </p>
                      </div>
                    </div>
                  )}

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
                  <Select
                    value={personality}
                    onValueChange={(v) => setPersonality(v as any)}
                  >
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
                    <div className="flex items-center gap-2">
                      <Label>Voice Input</Label>
                      {isFreePlan && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-linear-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-medium">
                          <Sparkles className="w-3 h-3" /> Pro
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isFreePlan
                        ? "Upgrade to Pro to enable voice input"
                        : "Allow users to speak their answers"}
                    </p>
                  </div>
                  <Switch
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                    disabled={isFreePlan}
                  />
                </div>
              </div>
              {/* Respondent Experience */}
              <div className="space-y-4">
                <h3 className="font-medium">Respondent Experience</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Save and Resume</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow respondents to save their progress and resume later
                    </p>
                  </div>
                  <Switch
                    checked={allowSaveAndResume}
                    onCheckedChange={setAllowSaveAndResume}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="design" className="space-y-4">
          {isFreePlan && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  Custom Branding requires Pro
                </p>
                <p className="text-sm text-amber-700">
                  Upgrade to customize colors, fonts, and add your logo.
                </p>
              </div>
              <Link href="/dashboard/pricing">
                <Button
                  size="sm"
                  className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Upgrade
                </Button>
              </Link>
            </div>
          )}
          <Card className={isFreePlan ? "opacity-60 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Form Design
                {isFreePlan && (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </CardTitle>
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
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font">Font Family</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger id="font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Sans-serif)</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
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
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Integrations</CardTitle>
              <CardDescription>
                Connect your form to other services like Notion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {form && <NotionMapping form={form as any} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
