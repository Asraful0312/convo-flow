"use client"

import type React from "react"

import { use, useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Sparkles, Send, Mic, Check } from "lucide-react"
import { mockForms, mockQuestions } from "@/lib/mock-data"

interface Message {
  id: string
  role: "ai" | "user"
  content: string
  timestamp: Date
}

export default function FormSubmissionPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params)
  const [form] = useState(() => mockForms.find((f) => f.id === formId))
  const [questions] = useState(() => mockQuestions[formId] || [])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    if (!form) return

    // Welcome message
    const welcomeMessage: Message = {
      id: "welcome",
      role: "ai",
      content: `Hi! Welcome to ${form.title}. ${form.description || "I'll guide you through a few questions."}`,
      timestamp: new Date(),
    }

    setMessages([welcomeMessage])

    // Ask first question after a delay
    setTimeout(() => {
      askQuestion(0)
    }, 1000)
  }, [form])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      completeForm()
      return
    }

    const question = questions[index]
    setIsTyping(true)

    setTimeout(() => {
      const questionMessage: Message = {
        id: `q-${question.id}`,
        role: "ai",
        content: question.text,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, questionMessage])
      setIsTyping(false)
      inputRef.current?.focus()
    }, 800)
  }

  const handleSubmitAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return

    // Add user's answer to messages
    const answerMessage: Message = {
      id: `a-${currentQuestion.id}`,
      role: "user",
      content: Array.isArray(answer) ? answer.join(", ") : answer,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, answerMessage])
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
    setInputValue("")

    // Move to next question
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1)
      askQuestion(currentQuestionIndex + 1)
    }, 500)
  }

  const completeForm = () => {
    setIsTyping(true)
    setTimeout(() => {
      const completionMessage: Message = {
        id: "complete",
        role: "ai",
        content: "Thank you for completing the form! Your responses have been recorded.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, completionMessage])
      setIsTyping(false)
      setIsCompleted(true)
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
      e.preventDefault()
      handleSubmitAnswer(inputValue.trim())
    }
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Form not found</h1>
          <p className="text-muted-foreground">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">{form.title}</h1>
              <p className="text-xs text-muted-foreground">Powered by ConvoFlow</p>
            </div>
          </div>
          {!isCompleted && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6366f1] to-[#f97316] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-slide-up ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "ai" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === "user" ? "bg-[#6366f1] text-white" : "bg-card border border-border shadow-sm"
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0 text-white font-medium">
                    U
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start animate-slide-up">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="flex justify-center animate-slide-up">
                <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 max-w-md shadow-lg">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold">All done!</h3>
                  <p className="text-muted-foreground">
                    Thank you for taking the time to complete this form. Your responses have been recorded.
                  </p>
                  <Button className="bg-[#6366f1] hover:bg-[#4f46e5]">Close</Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {!isCompleted && currentQuestion && (
        <div className="border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            {currentQuestion.type === "choice" && currentQuestion.options ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Select an option:</p>
                <RadioGroup onValueChange={(value) => handleSubmitAnswer(value)} className="grid sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index}>
                      <RadioGroupItem value={option} id={`option-${index}`} className="peer sr-only" />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex items-center justify-center rounded-lg border-2 border-border bg-card px-6 py-4 hover:bg-muted cursor-pointer peer-data-[state=checked]:border-[#6366f1] peer-data-[state=checked]:bg-[#6366f1]/5 transition-all"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  {currentQuestion.type === "text" && currentQuestion.text.toLowerCase().includes("improve") ? (
                    <Textarea
                      ref={inputRef as any}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your answer..."
                      className="min-h-[60px] pr-24 resize-none bg-card"
                      onKeyDown={handleKeyPress}
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      type={currentQuestion.type === "email" ? "email" : "text"}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentQuestion.type === "email" ? "your@email.com" : "Type your answer..."}
                      className="h-14 pr-24 bg-card"
                      onKeyDown={handleKeyPress}
                    />
                  )}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-muted" title="Voice input">
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => handleSubmitAnswer(inputValue.trim())}
                  disabled={!inputValue.trim()}
                  className="h-14 px-6 bg-[#6366f1] hover:bg-[#4f46e5]"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            )}

            {!currentQuestion.required && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSubmitAnswer("")}
                  className="text-muted-foreground"
                >
                  Skip this question
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
