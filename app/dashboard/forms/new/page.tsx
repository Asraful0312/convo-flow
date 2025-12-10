"use client";

import { FormPreview } from "@/components/form-preview";
import Loader from "@/components/loader-grid";
import { Button } from "@/components/ui/button";
import { TextDotsLoader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowUp, Eye, Loader2, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const loadingMessages = [
  "Warming up the AI hamsters...",
  "Reticulating splines...",
  "Asking the form gods for inspiration...",
  "Adding a dash of conversational charm...",
  "Making sure the pixels are perfectly aligned...",
  "Polishing the submit button to a high shine...",
  "Just one more thing... checking for rogue semicolons.",
];

export default function NewFormPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(
    null,
  );
  const [loadingMessage, setLoadingMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const user = useQuery(api.auth.loggedInUser);
  const userRole = useQuery(
    api.users.getRole,
    user?.activeWorkspaceId ? { workspaceId: user.activeWorkspaceId } : "skip"
  );

  const generateFormAction = useAction(api.ai.generateForm);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  // Redirect viewers - they cannot create forms
  useEffect(() => {
    if (userRole === "viewer") {
      router.push("/dashboard/forms");
    }
  }, [userRole, router]);

  console.log("user role", userRole)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isGenerating) {
      if (generatedForm) {
        setLoadingMessage("Refining...");
        return;
      }

      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGenerating, generatedForm]);

  // Switch to preview tab automatically when form is generated on mobile
  useEffect(() => {
    if (generatedForm && window.innerWidth < 1024) {
      setMobileTab("preview");
    }
  }, [generatedForm]);

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
    const currentPrompt = description;
    setDescription("");

    try {
      const generated: any = await generateFormAction({
        prompt: currentPrompt,
        conversationHistory,
      });

      if (generated.clarification) {
        setConversationHistory([
          ...fullConversation,
          { role: "ai", content: generated.clarification },
        ]);
      } else if (generated.questions) {
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
      } else {
        throw new Error("Invalid response from AI.");
      }
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
      const refined: any = await generateFormAction({
        prompt: refinement,
        conversationHistory,
      });

      if (refined.clarification) {
        setConversationHistory([
          ...fullConversation,
          { role: "ai", content: refined.clarification },
        ]);
      } else if (refined.questions) {
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
      } else {
        throw new Error("Invalid response from AI.");
      }
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

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-2 bg-white dark:bg-zinc-900 border-b border-border gap-2 shrink-0 z-20">
        <Button
          variant={mobileTab === "chat" ? "secondary" : "ghost"}
          onClick={() => setMobileTab("chat")}
          className={cn(
            "flex-1 gap-2",
            mobileTab === "chat" && "bg-[#F56A4D]/10 text-[#F56A4D] hover:bg-[#F56A4D]/20"
          )}
          size="sm"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </Button>
        <Button
          variant={mobileTab === "preview" ? "secondary" : "ghost"}
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 gap-2",
            mobileTab === "preview" && "bg-[#F56A4D]/10 text-[#F56A4D] hover:bg-[#F56A4D]/20"
          )}
          size="sm"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </div>

      {/* LEFT: AI Chat */}
      <div 
        className={cn(
          "w-full lg:w-[45%] xl:w-[40%] border-r border-border flex flex-col bg-white dark:bg-zinc-900 relative z-10 shadow-xl transition-all h-full",
          mobileTab === "chat" ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F56A4D]" />
                AI Form Generator
            </h1>
            <p className="text-sm text-muted-foreground">Describe your form and let AI build it for you.</p>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {conversationHistory.length === 0 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground/80">
                  Try an example
                </h3>
                <div className="grid gap-3">
                  {examplePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setDescription(prompt)}
                      className="text-left p-4 rounded-xl border border-border hover:border-[#F56A4D] hover:bg-[#F56A4D]/5 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                            <Wand2 className="w-4 h-4 text-muted-foreground group-hover:text-[#F56A4D] transition-colors" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <h3 className="font-semibold text-sm mb-3 text-foreground/80">
                  Pro Tips
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F56A4D] mt-1.5 shrink-0" />
                    <span>Be specific about the information you need to collect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F56A4D] mt-1.5 shrink-0" />
                    <span>Mention the purpose (survey, registration, quiz)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F56A4D] mt-1.5 shrink-0" />
                    <span>You can refine the form iteratively after generation</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {conversationHistory.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center shrink-0 shadow-md mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                        "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
                        msg.role === "user"
                            ? "bg-[#F56A4D] text-white rounded-tr-sm"
                            : "bg-white dark:bg-zinc-800 border border-border rounded-tl-sm"
                    )}
                  >
                    <p>{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-medium border border-border mt-1">
                      You
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isGenerating && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center shrink-0 shadow-md mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 border border-border rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F56A4D]" />
                      <span className="text-sm text-muted-foreground font-medium">
                        {loadingMessage}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-white dark:bg-zinc-900">
          <div className="relative rounded-xl border border-border bg-muted/30 focus-within:ring-2 focus-within:ring-[#F56A4D]/20 focus-within:border-[#F56A4D] transition-all shadow-sm">
            <Textarea
              value={description}
              ref={textareaRef}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                generatedForm
                  ? "Refine your form... (e.g., 'Add a phone number field')"
                  : "Describe the form you want to create..."
              }
              className="min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 p-4 pr-12 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (description.trim() && !isGenerating) {
                      generatedForm ? handleRefine(description) : handleGenerate();
                  }
                }
              }}
            />
            <div className="absolute bottom-3 right-3">
                <Button
                    size="icon"
                    onClick={
                    generatedForm
                        ? () => handleRefine(description)
                        : handleGenerate
                    }
                    disabled={!description.trim() || isGenerating}
                    className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        description.trim() 
                            ? "bg-[#F56A4D] hover:bg-[#F56A4D]/90 text-white shadow-md" 
                            : "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ArrowUp className="w-4 h-4" />
                    )}
                </Button>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px] font-sans">Enter</kbd> to send
          </p>
        </div>
      </div>

      {/* RIGHT: Preview + Settings */}
      <div 
        className={cn(
          "flex-1 bg-muted/30 relative transition-all h-full overflow-hidden",
          mobileTab === "preview" ? "flex flex-col" : "hidden lg:flex flex-col"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-50 pointer-events-none" />
        
        {isGenerating && !generatedForm ? (
          <div className="h-full flex items-center justify-center p-12 relative z-10">
            <div className="text-center space-y-6 max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-border/50">
              <div className="flex items-center justify-center scale-125 mb-4">
                <Loader />
              </div>
              <div className="space-y-2">
                <TextDotsLoader
                    size="lg"
                    text="Generating form"
                    className="justify-center font-semibold text-lg"
                />
                <p className="text-sm text-muted-foreground">
                    Our AI hamsters are working hard to build your form...
                </p>
              </div>
            </div>
          </div>
        ) : generatedForm ? (
          <div className="h-full flex flex-col relative z-10 overflow-hidden">
            <FormPreview form={generatedForm} setForm={setGeneratedForm} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-12 relative z-10">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 rotate-3 transition-transform hover:rotate-6 duration-300">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Your form will appear here</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Describe what you want on the left, and watch AI generate a
                    beautiful, interactive form in real-time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}