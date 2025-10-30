"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Wand2, MessageSquare } from "lucide-react"
import { FormPreview } from "@/components/form-preview"
import type { Question } from "@/lib/types"

export default function NewFormPage() {
  const [description, setDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedForm, setGeneratedForm] = useState<{
    title: string
    description: string
    questions: Question[]
  } | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "ai"; content: string }>>([])

  const examplePrompts = [
    "Create a customer feedback survey with rating scales and open-ended questions",
    "Build a lead generation form for a SaaS product that qualifies prospects",
    "Make an event registration form with dietary preferences and t-shirt sizes",
    "Design a job application form with resume upload and screening questions",
  ]

  const handleGenerate = async () => {
    if (!description.trim()) return

    setIsGenerating(true)
    setConversationHistory([...conversationHistory, { role: "user", content: description }])

    // Simulate AI generation - in production this would call OpenAI API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock generated form based on description
    const mockForm = {
      title: "Generated Form",
      description: "AI-generated form based on your description",
      questions: [
        {
          id: "q1",
          form_id: "new",
          order: 1,
          type: "text" as const,
          text: "What is your name?",
          required: true,
        },
        {
          id: "q2",
          form_id: "new",
          order: 2,
          type: "email" as const,
          text: "What is your email address?",
          required: true,
        },
        {
          id: "q3",
          form_id: "new",
          order: 3,
          type: "choice" as const,
          text: "How did you hear about us?",
          options: ["Search Engine", "Social Media", "Friend", "Other"],
          required: true,
        },
      ],
    }

    setGeneratedForm(mockForm)
    setConversationHistory([
      ...conversationHistory,
      { role: "user", content: description },
      {
        role: "ai",
        content: `I've created a form with ${mockForm.questions.length} questions based on your description. You can preview it on the right and make any adjustments you'd like.`,
      },
    ])
    setIsGenerating(false)
    setDescription("")
  }

  const handleRefine = async (refinement: string) => {
    setIsGenerating(true)
    setConversationHistory([...conversationHistory, { role: "user", content: refinement }])

    // Simulate AI refinement
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setConversationHistory([
      ...conversationHistory,
      { role: "user", content: refinement },
      { role: "ai", content: "I've updated the form based on your feedback. Check out the changes!" },
    ])
    setIsGenerating(false)
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left Panel - AI Chat Interface */}
      <div className="w-full lg:w-1/2 border-r border-border flex flex-col bg-background">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create with AI</h1>
              <p className="text-sm text-muted-foreground">Describe your form and let AI build it</p>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Get started with an example</h3>
                <div className="grid gap-3">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setDescription(prompt)}
                      className="text-left p-4 rounded-lg border border-border hover:border-[#6366f1] hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <Wand2 className="w-5 h-5 text-muted-foreground group-hover:text-[#6366f1] transition-colors mt-0.5" />
                        <p className="text-sm leading-relaxed">{prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Tips for better results</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366f1] mt-1">•</span>
                    <span>Be specific about what information you need to collect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366f1] mt-1">•</span>
                    <span>Mention the purpose of the form (survey, registration, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366f1] mt-1">•</span>
                    <span>Include any special requirements or conditional logic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366f1] mt-1">•</span>
                    <span>You can refine the form after it's generated</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {conversationHistory.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "ai" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user" ? "bg-[#6366f1] text-white" : "bg-muted border border-border"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
                      U
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Generating your form...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                generatedForm
                  ? "Refine your form... (e.g., 'Add a phone number field' or 'Make the email optional')"
                  : "Describe the form you want to create... (e.g., 'Create a customer feedback survey with rating questions')"
              }
              className="min-h-[100px] resize-none bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  if (generatedForm) {
                    handleRefine(description)
                  } else {
                    handleGenerate()
                  }
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + Enter to send
              </p>
              <Button
                onClick={generatedForm ? () => handleRefine(description) : handleGenerate}
                disabled={!description.trim() || isGenerating}
                className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
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

      {/* Right Panel - Form Preview */}
      <div className="hidden lg:block w-1/2 bg-muted/30">
        {generatedForm ? (
          <FormPreview form={generatedForm} />
        ) : (
          <div className="h-full flex items-center justify-center p-12">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Your form will appear here</h3>
              <p className="text-muted-foreground leading-relaxed">
                Describe what you want to create on the left, and watch as AI generates a beautiful, functional form in
                real-time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
