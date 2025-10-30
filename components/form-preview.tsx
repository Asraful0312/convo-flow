"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Eye, Code, Settings, Save } from "lucide-react"
import type { Question } from "@/lib/types"

interface FormPreviewProps {
  form: {
    title: string
    description: string
    questions: Question[]
  }
}

export function FormPreview({ form }: FormPreviewProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "settings">("preview")

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Form Preview</h2>
          <Button className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
            <Save className="w-4 h-4" />
            Save Form
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

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
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

                    {question.type === "text" && (
                      <Input placeholder="Type your answer here..." className="bg-background" />
                    )}

                    {question.type === "email" && (
                      <Input type="email" placeholder="your@email.com" className="bg-background" />
                    )}

                    {question.type === "choice" && question.options && (
                      <RadioGroup>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                            <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                ))}
              </div>

              <Button className="w-full bg-[#6366f1] hover:bg-[#4f46e5]">Submit</Button>
            </Card>
          </div>
        )}

        {activeTab === "code" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {form.questions.map((question, index) => (
              <Card key={question.id} className="p-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Question {index + 1}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          question.required
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {question.required ? "Required" : "Optional"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {question.type}
                      </span>
                    </div>
                    <p className="font-medium">{question.text}</p>
                    {question.options && (
                      <div className="text-sm text-muted-foreground">Options: {question.options.join(", ")}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input id="form-title" value={form.title} className="bg-background" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-description">Description</Label>
                  <Input id="form-description" value={form.description} className="bg-background" />
                </div>

                <div className="space-y-2">
                  <Label>Branding</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color" className="text-sm">
                        Primary Color
                      </Label>
                      <Input id="primary-color" type="color" value="#6366f1" className="h-10 bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color" className="text-sm">
                        Accent Color
                      </Label>
                      <Input id="accent-color" type="color" value="#f97316" className="h-10 bg-background" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>AI Personality</Label>
                  <RadioGroup defaultValue="friendly">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="friendly" id="friendly" />
                      <Label htmlFor="friendly" className="font-normal cursor-pointer">
                        Friendly - Warm and conversational
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="professional" id="professional" />
                      <Label htmlFor="professional" className="font-normal cursor-pointer">
                        Professional - Formal and business-like
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="casual" id="casual" />
                      <Label htmlFor="casual" className="font-normal cursor-pointer">
                        Casual - Relaxed and informal
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
