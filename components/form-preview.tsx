"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Eye, Code, Settings, Save, Loader2, Star, UploadCloud } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Question } from "@/lib/types"

// ── All Supported Question Types ───────────────────────────────
type QuestionType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "phone"
  | "date"
  | "time"
  | "choice"
  | "multiple_choice"
  | "rating"
  | "likert"
  | "file"
  | "dropdown"     // NEW
  | "url"         // NEW
  | "scale"       // NEW

interface FormPreviewProps {
  form: {
    title: string
    description: string
    questions: (Question & { id: string })[]
    settings?: {
      branding?: { primaryColor?: string; logoUrl?: string }
      notifications?: { emailOnResponse?: boolean; notificationEmail?: string }
    }
    aiConfig?: {
      personality?: "professional" | "friendly" | "casual" | "formal"
      voiceEnabled?: boolean
    }
  }
  setForm: React.Dispatch<React.SetStateAction<FormPreviewProps["form"] | null>>
}

export function FormPreview({ form, setForm }: FormPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "settings">("preview")
  const [isSaving, setIsSaving] = useState(false)
  const [answers, setAnswers] = useState<{ [key: string]: any }>({})
  const [hoveredRatings, setHoveredRatings] = useState<{ [key: string]: number }>({})
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  const saveForm = useMutation(api.forms.create)
  const router = useRouter()


  const [primaryColor, setPrimaryColor] = useState(form.settings?.branding?.primaryColor ?? "#6366f1")
  const [logoUrl, setLogoUrl] = useState(form.settings?.branding?.logoUrl ?? "")
  const [emailOnResponse, setEmailOnResponse] = useState(form.settings?.notifications?.emailOnResponse ?? false)
  const [notificationEmail, setNotificationEmail] = useState(form.settings?.notifications?.notificationEmail ?? "")
  const [personality, setPersonality] = useState(form.aiConfig?.personality ?? "friendly")
  const [voiceEnabled, setVoiceEnabled] = useState(form.aiConfig?.voiceEnabled ?? false)

  useEffect(() => {
    setPrimaryColor(form.settings?.branding?.primaryColor ?? "#6366f1")
    setLogoUrl(form.settings?.branding?.logoUrl ?? "")
    setEmailOnResponse(form.settings?.notifications?.emailOnResponse ?? false)
    setNotificationEmail(form.settings?.notifications?.notificationEmail ?? "")
    setPersonality(form.aiConfig?.personality ?? "friendly")
    setVoiceEnabled(form.aiConfig?.voiceEnabled ?? false)
  }, [form])

  // ── Handlers ───────────────────────────────────────────────────
  const handleMultiChoiceChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const existing = (prev[questionId] as string[] | undefined) || []
      return {
        ...prev,
        [questionId]: checked ? [...existing, option] : existing.filter((o) => o !== option),
      }
    })
  }

  const handleRatingChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleHoverRating = (questionId: string, value: number) => {
    setHoveredRatings((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleScaleChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleQuestionChange = (questionId: string, updated: Partial<Question>) => {
    setForm((prev) => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updated } : q
        ),
      }
    })
  }

  
  const handleSaveForm = async () => {
    setIsSaving(true)
    try {
      const formId = await saveForm({
        title: form.title,
        description: form.description,
        questions: form.questions.map(({ id, ...q }) => ({
          text: q.text,
          type: q.type,
          required: q.required,
          options: q.options,
        })),
        settings: {
          branding: { primaryColor, logoUrl: logoUrl || undefined },
          notifications: {
            emailOnResponse,
            notificationEmail: notificationEmail || undefined,
          },
        },
        aiConfig: { personality, enableVoice: voiceEnabled },
      })
      router.push(`/dashboard/forms/${formId}/edit`)
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Form Preview</h2>
          <Button onClick={handleSaveForm} disabled={isSaving} className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Form
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("preview")}
            className={activeTab === "preview" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : ""}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={activeTab === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("code")}
            className={activeTab === "code" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : ""}
          >
            <Code className="w-4 h-4 mr-2" />
            Questions
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("settings")}
            className={activeTab === "settings" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : ""}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── PREVIEW TAB ── */}
        {activeTab === "preview" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{form.title}</h1>
                <p className="text-muted-foreground">{form.description}</p>
              </div>
              <div className="space-y-6">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-base">
                      {index + 1}. {question.text}
                      {question.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {/* ALL QUESTION TYPES */}
                    {question.type === "text" && (
                      <Input
                        placeholder="Short answer..."
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "textarea" && (
                      <Textarea
                        placeholder="Long answer..."
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "email" && (
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "number" && (
                      <Input
                        type="number"
                        placeholder="42"
                        value={(answers[question.id] as number) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.valueAsNumber }))}
                      />
                    )}

                    {question.type === "phone" && (
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "date" && (
                      <Input
                        type="date"
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "time" && (
                      <Input
                        type="time"
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "url" && (
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [question.id]: e.target.value }))}
                      />
                    )}

                    {question.type === "choice" && question.options && (
                      <RadioGroup
                        value={(answers[question.id] as string) || ""}
                        onValueChange={(v) => setAnswers((p) => ({ ...p, [question.id]: v }))}
                      >
                        {question.options.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt} id={`choice-${question.id}-${i}`} />
                            <Label htmlFor={`choice-${question.id}-${i}`} className="font-normal cursor-pointer">
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.type === "multiple_choice" && question.options && (
                      <div className="space-y-2">
                        {question.options.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mc-${question.id}-${i}`}
                              checked={((answers[question.id] as string[]) || []).includes(opt)}
                              onCheckedChange={(c) => handleMultiChoiceChange(question.id, opt, !!c)}
                            />
                            <Label htmlFor={`mc-${question.id}-${i}`} className="font-normal cursor-pointer">
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "dropdown" && question.options && (
                      <Select
                        value={(answers[question.id] as string) || ""}
                        onValueChange={(v) => setAnswers((p) => ({ ...p, [question.id]: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((opt, i) => (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {question.type === "rating" && (
                      <div
                        className="flex items-center gap-1"
                        onMouseLeave={() => handleHoverRating(question.id, 0)}
                      >
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onMouseEnter={() => handleHoverRating(question.id, v)}
                            onClick={() => handleRatingChange(question.id, v)}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                hoveredRatings[question.id] >= v || (answers[question.id] as number) >= v
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {question.type === "scale" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>10</span>
                        </div>
                        <RadioGroup
                          value={(answers[question.id] as string) || ""}
                          onValueChange={(v) => handleScaleChange(question.id, parseInt(v))}
                          className="flex justify-between"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                            <div key={v} className="flex flex-col items-center">
                              <RadioGroupItem value={v.toString()} id={`scale-${question.id}-${v}`} className="sr-only" />
                              <Label
                                htmlFor={`scale-${question.id}-${v}`}
                                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                                  (answers[question.id] as number) === v
                                    ? "bg-[#6366f1] text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                              >
                                {v}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {question.type === "likert" && question.options && (
                      <RadioGroup
                        value={(answers[question.id] as string) || ""}
                        onValueChange={(v) => setAnswers((p) => ({ ...p, [question.id]: v }))}
                      >
                        <div className="flex justify-between">
                          {question.options.map((opt, i) => (
                            <div key={i} className="flex flex-col items-center space-y-2">
                              <RadioGroupItem value={opt} id={`likert-${question.id}-${i}`} />
                              <Label
                                htmlFor={`likert-${question.id}-${i}`}
                                className="text-xs text-center font-normal cursor-pointer"
                              >
                                {opt}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {question.type === "file" && (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                          </div>
                          <input type="file" className="hidden" />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full bg-[#6366f1] hover:bg-[#4f46e5]">Submit</Button>
            </Card>
          </div>
        )}

        {/* ── CODE TAB (Question Editor) ── */}
        {activeTab === "code" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {form.questions.map((question, index) => (
              <Card key={question.id} className="p-6 space-y-4">
                {editingQuestionId === question.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Input
                        value={question.text}
                        onChange={(e) => handleQuestionChange(question.id, { text: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(type) => handleQuestionChange(question.id, { type } as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                            <SelectItem value="choice">Single Choice</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="rating">Rating (1–5)</SelectItem>
                            <SelectItem value="scale">Scale (1–10)</SelectItem>
                            <SelectItem value="likert">Likert Scale</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Required</Label>
                        <div className="flex items-center h-10">
                          <Switch
                            checked={question.required}
                            onCheckedChange={(r) => handleQuestionChange(question.id, { required: r })}
                          />
                        </div>
                      </div>
                    </div>
                    {(question.type === "choice" ||
                      question.type === "multiple_choice" ||
                      question.type === "dropdown" ||
                      question.type === "likert") && (
                      <div className="space-y-2">
                        <Label>Options (one per line)</Label>
                        <Textarea
                          value={question.options?.join("\n") || ""}
                          onChange={(e) =>
                            handleQuestionChange(question.id, {
                              options: e.target.value.split("\n").filter(Boolean),
                            })
                          }
                        />
                      </div>
                    )}
                    <Button size="sm" onClick={() => setEditingQuestionId(null)}>
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Q{index + 1}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            question.required
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {question.required ? "Required" : "Optional"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          {question.type}
                        </span>
                      </div>
                      <p className="font-medium">{question.text}</p>
                      {question.options && (
                        <p className="text-sm text-muted-foreground">
                          Options: {question.options.join(", ")}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditingQuestionId(question.id)}>
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={form.description}
                    onChange={(e) => setForm((f) => f ? { ...f, description: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Branding</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Notifications</h3>
                  <div className="flex items-center justify-between">
                    <Label>Email on new response</Label>
                    <Switch checked={emailOnResponse} onCheckedChange={setEmailOnResponse} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Email</Label>
                    <Input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">AI Configuration</h3>
                  <div className="space-y-2">
                    <Label>Personality</Label>
                    <Select value={personality} onValueChange={(v) => setPersonality(v as any)}>
                      <SelectTrigger>
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
                    <Label>Voice Input</Label>
                    <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}