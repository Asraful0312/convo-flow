"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2, MessageSquare, Save } from "lucide-react";
import { FormPreview } from "@/components/form-preview";
import type { Question } from "@/lib/types";
import CandidLogo from "@/components/shared/candid-logo";
import { toast } from "sonner";

type GeneratedForm = {
  title: string;
  description: string;
  questions: (Question & { id: string })[];
  settings?: {
    branding?: { primaryColor?: string; logoUrl?: string };
    notifications?: { emailOnResponse?: boolean; notificationEmail?: string };
  };
  aiConfig?: {
    personality?: "professional" | "friendly" | "casual" | "formal";
    voiceEnabled?: boolean;
  };
};

export default function NewFormPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(
    null,
  );
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([]);

  const generateFormAction = useAction(api.ai.generateForm);
  const createFormMutation = useMutation(api.forms.create);

  const examplePrompts = [
    "Create a customer feedback survey with rating scales and open-ended questions",
    "Build a lead generation form for a SaaS product that qualifies prospects",
    "Make an event registration form with dietary preferences and t-shirt sizes",
    "Design a job application form with resume upload and screening questions",
  ];

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    const fullConversation = [
      ...conversationHistory,
      { role: "user" as const, content: description },
    ];
    setConversationHistory(fullConversation);
    setDescription("");

    try {
      const generated = await generateFormAction({
        prompt: description,
        conversationHistory,
      });

      const formWithClientIds = {
        ...generated,
        questions: generated.questions.map((q: any, i: number) => ({
          ...q,
          id: `client-q-${i}`,
        })),
      };
      setGeneratedForm(formWithClientIds);
      setConversationHistory([
        ...fullConversation,
        {
          role: "ai",
          content: `Generated a form with ${generated.questions.length} questions. You can refine or save it!`,
        },
      ]);
    } catch (error) {
      console.error(error);
      setConversationHistory([
        ...fullConversation,
        {
          role: "ai",
          content: "Sorry, I couldn't generate the form. Try rephrasing.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (refinement: string) => {
    if (!refinement.trim() || !generatedForm) return;
    setIsGenerating(true);
    const fullConversation = [
      ...conversationHistory,
      { role: "user" as const, content: refinement },
    ];
    setConversationHistory(fullConversation);
    setDescription("");

    try {
      const refined = await generateFormAction({
        prompt: refinement,
        conversationHistory,
      });

      const formWithClientIds = {
        ...refined,
        questions: refined.questions.map((q: any, i: number) => ({
          ...q,
          id: `client-q-${i}`,
        })),
      };
      setGeneratedForm(formWithClientIds);
      setConversationHistory([
        ...fullConversation,
        {
          role: "ai",
          content: `Updated! Now with ${refined.questions.length} questions. Keep refining or save.`,
        },
      ]);
    } catch (error) {
      console.error(error);
      setConversationHistory([
        ...fullConversation,
        { role: "ai", content: "Couldn't refine. Try a clearer instruction." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedForm) return;
    try {
      const formId = await createFormMutation({
        title: generatedForm.title,
        description: generatedForm.description,
        questions: generatedForm.questions.map((q) => ({
          text: q.text,
          type: q.type,
          required: q.required,
          options: q.options,
        })),
        settings: {
          branding: generatedForm.settings?.branding,
          notifications: generatedForm.settings?.notifications,
        },
        aiConfig: generatedForm.aiConfig, // 👈 pass separately, not inside settings
      });

      router.push(`/dashboard/forms/${formId}/edit`);
    } catch (error: any) {
      toast.error(error.message || "Save failed:");
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* LEFT: AI Chat */}
      <div className="w-full lg:w-1/2 border-r border-border flex flex-col bg-background">
        <div className="px-6 border-b border-border">
          <div className="flex items-center gap-3 py-4">
            <CandidLogo />
            <div>
              <h1 className="text-2xl font-bold">Create with AI</h1>
              <p className="text-sm text-muted-foreground">
                Describe your form and let AI build it
              </p>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  Get started with an example
                </h3>
                <div className="grid gap-3">
                  {examplePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setDescription(prompt)}
                      className="text-left p-4 rounded-lg border border-border hover:border-[#F56A4D] hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <Wand2 className="w-5 h-5 text-muted-foreground group-hover:text-[#F56A4D] transition-colors mt-0.5" />
                        <p className="text-sm leading-relaxed">{prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  Tips for better results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F56A4D] mt-1">•</span>
                    <span>
                      Be specific about what information you need to collect
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F56A4D] mt-1">•</span>
                    <span>
                      Mention the purpose of the form (survey, registration,
                      etc.)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F56A4D] mt-1">•</span>
                    <span>
                      Include any special requirements or conditional logic
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F56A4D] mt-1">•</span>
                    <span>You can refine the form after it's generated</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversationHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === "user"
                        ? "bg-[#F56A4D] text-white"
                        : "bg-muted border border-border"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center shrink-0 text-white text-sm font-medium">
                      U
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {generatedForm ? "Refining..." : "Generating..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                generatedForm
                  ? "Refine your form... (e.g., 'Add a phone number field' or 'Make the email optional')"
                  : "Describe the form you want to create..."
              }
              className="min-h-[100px] resize-none bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  generatedForm ? handleRefine(description) : handleGenerate();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"} +
                Enter to send
              </p>
              <Button
                onClick={
                  generatedForm
                    ? () => handleRefine(description)
                    : handleGenerate
                }
                disabled={!description.trim() || isGenerating}
                className="bg-[#F56A4D] hover:bg-[#F56A4D] gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {generatedForm ? "Refining..." : "Generating..."}
                  </>
                ) : generatedForm ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Refine Form
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Preview + Settings */}
      <div className="hidden lg:block w-1/2 bg-muted/30">
        {generatedForm ? (
          <div className="h-full flex flex-col">
            <FormPreview form={generatedForm} setForm={setGeneratedForm} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-12">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Your form will appear here</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe what you want on the left, and watch AI generate a
                beautiful form in real-time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
