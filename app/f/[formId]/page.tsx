"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Sparkles, Send, Mic, MicOff, Volume2, VolumeX, Check, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { toast } from "sonner"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: number
  questionId?: string
  isAdaptive?: boolean
}

export default function FormSubmissionPage({ params }: { params: { formId: string } }) {
  const formId = params.formId as Id<"forms">
  
  // Convex queries and mutations
  const form = useQuery(api.forms.getSingleForm, { formId })
  const questions = useQuery(api.questions.getFormQuestions, { formId })
  const createResponse = useMutation(api.responses.createResponse)
  const updateResponse = useMutation(api.responses.updateResponse)
  const saveAnswer = useMutation(api.answers.saveAnswer)
  const saveConversation = useMutation(api.conversations.saveConversation)
  const getConversationalQuestion = useAction(api.ai.getConversationalQuestion)
  
  // State management
  const [started, setStarted] = useState(false)
  const [responseId, setResponseId] = useState<Id<"responses"> | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Voice states
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const currentQuestion = questions?.[currentQuestionIndex]
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  // Get brand colors
  const primaryColor = form?.settings.branding?.primaryColor || "#F56A4D"
  const secondaryColor = form?.settings.branding?.secondaryColor || "#2EB7A7"

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = form?.aiConfig?.language || "en-US"

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join("")
          setInputValue(transcript)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
          stopAudioVisualization()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      stopAudioVisualization()
    }
  }, [form])

  // Set initial voice state
  useEffect(() => {
    if (form && form.aiConfig?.enableVoice) {
      setVoiceEnabled(true)
    }
  }, [form])

  const handleStart = async () => {
    if (!form || !questions) return

    if(form.status === "draft") {
      toast.error(`Can't start the form in ${form.status} mode please make it public`	)
      return
    }	

    setStarted(true)

    const personality = form.aiConfig?.personality || "friendly"
    const welcomeText = getWelcomeMessage(personality, form.title)

    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: welcomeText,
      timestamp: Date.now(),
    }

    setMessages([welcomeMessage])
    await speakText(welcomeText)

    setTimeout(() => {
      askQuestion(0)
    }, 1500)
  }

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Audio visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
      }

      updateLevel()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setAudioLevel(0)
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      stopAudioVisualization()
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
      startAudioVisualization()
    }
  }

  // Text-to-speech with ElevenLabs (fallback to browser TTS)
  const speakText = async (text: string) => {
    if (!voiceEnabled) return

    setIsSpeaking(true)

    try {
      // Try ElevenLabs API (you'll need to set up the API key)
      const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      
      if (ELEVENLABS_API_KEY) {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
              },
            }),
          }
        )

        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          
          if (audioElementRef.current) {
            audioElementRef.current.pause()
          }
          
          audioElementRef.current = new Audio(audioUrl)
          audioElementRef.current.onended = () => setIsSpeaking(false)
          await audioElementRef.current.play()
          return
        }
      }

      // Fallback to browser TTS
      if (typeof window !== "undefined") {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("TTS error:", error)
      setIsSpeaking(false)
    }
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)
    if (voiceEnabled) {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel()
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
      setIsSpeaking(false)
    }
  }

  // Get personalized welcome message
  const getWelcomeMessage = (personality: string, formTitle: string) => {
    const messages = {
      professional: `Good day. I'll guide you through the ${formTitle} form. Shall we begin?`,
      friendly: `Hi! I'm here to help with the ${formTitle}. Ready to get started?`,
      casual: `Hey! Let's breeze through this ${formTitle} together. You ready?`,
      formal: `Greetings. I will assist you in completing the ${formTitle}. May we proceed?`,
    }
    return messages[personality as keyof typeof messages] || messages.friendly
  }

  // Ask question with AI conversation
  const askQuestion = (index: number) => {
    if (!questions || index >= questions.length) {
      completeForm()
      return
    }

    const question = questions[index]
    setIsTyping(true)

    setTimeout(async () => {
      const historyForAI = messages.map((m) => ({
        role: m.role === "assistant" ? ("ai" as const) : ("user" as const),
        content: m.content,
      }))

      const conversationalText = await getConversationalQuestion({
        question: question.text,
        history: historyForAI,
      })

      const questionText = conversationalText || question.text
      const isAdaptive = conversationalText ? conversationalText !== question.text : false

      const questionMessage: Message = {
        id: `q-${question._id}`,
        role: "assistant",
        content: questionText,
        timestamp: Date.now(),
        questionId: question._id,
        isAdaptive,
      }

      setMessages((prev) => [...prev, questionMessage])
      setIsTyping(false)
      await speakText(questionText)
      inputRef.current?.focus()
    }, 800)
  }

  // Handle answer submission
  const handleSubmitAnswer = async (answer: string | string[]) => {
    if (!currentQuestion || isProcessing) return

    setIsProcessing(true)

    try {
      let currentResponseId = responseId

      // If this is the first answer, create the response document first
      if (!currentResponseId) {
        const newResponseId = await createResponse({
          formId,
          metadata: {
            device: navigator.userAgent,
            browser: navigator.userAgent,
            os: navigator.platform,
          },
        })
        setResponseId(newResponseId)
        currentResponseId = newResponseId
      }

      if (!currentResponseId) {
        throw new Error("Failed to create or find response ID")
      }

      // Save answer to database
      await saveAnswer({
        responseId: currentResponseId,
        questionId: currentQuestion._id,
        value: answer,
      })

      // Add to local state
      setAnswers((prev) => ({ ...prev, [currentQuestion._id]: answer }))

      // Add user message
      const answerMessage: Message = {
        id: `a-${currentQuestion._id}`,
        role: "user",
        content: Array.isArray(answer) ? answer.join(", ") : answer,
        timestamp: Date.now(),
        questionId: currentQuestion._id,
      }

      const newMessages = [...messages, answerMessage]
      setMessages(newMessages)
      setInputValue("")

      // Save conversation
      await saveConversation({
        responseId: currentResponseId,
        messages: newMessages,
        aiContext: {
          currentQuestionIndex,
          answeredQuestions: Object.keys({ ...answers, [currentQuestion._id]: answer }),
          skippedQuestions: [],
        },
      })

      // Move to next question
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1)
        askQuestion(currentQuestionIndex + 1)
        setIsProcessing(false)
      }, 500)
    } catch (error) {
      console.error("Error saving answer:", error)
      setIsProcessing(false)
    }
  }

  // Complete form
  const completeForm = async () => {
    if (!responseId) return

    setIsTyping(true)

    try {
      // Update response status
      await updateResponse({
        responseId,
        status: "completed",
      })

      const personality = form?.aiConfig?.personality || "friendly"
      const completionMessages = {
        professional: "Thank you for completing the form. Your responses have been recorded.",
        friendly: "All set! Thanks for taking the time to fill this out. We'll be in touch soon!",
        casual: "Done! Thanks for the chat. Catch you later!",
        formal: "Your submission has been successfully recorded. Thank you for your participation.",
      }

      await new Promise((resolve) => setTimeout(resolve, 800))

      const completionMessage: Message = {
        id: "complete",
        role: "assistant",
        content: completionMessages[personality as keyof typeof completionMessages] || completionMessages.friendly,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, completionMessage])
      setIsTyping(false)
      setIsCompleted(true)
      await speakText(completionMessage.content)

      // Celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [primaryColor, secondaryColor, "#A3E635"],
      })
    } catch (error) {
      console.error("Error completing form:", error)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && inputValue.trim() && !isProcessing) {
      e.preventDefault()
      handleSubmitAnswer(inputValue.trim())
    }
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <div className="flex items-center gap-3 mb-4">
          {form.settings.branding?.logoUrl ? (
            <img src={form.settings.branding.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
        {form.description && <p className="text-lg text-gray-600 max-w-2xl mb-6">{form.description}</p>}
        <Button
          onClick={handleStart}
          className="h-12 px-8 text-lg text-white rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          Start Conversation
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {form.settings.branding?.logoUrl ? (
              <img src={form.settings.branding.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900 text-xl">{form.title}</h1>
              {form.description && <p className="text-xs text-gray-500">{form.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {form.aiConfig?.enableVoice && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="h-9 w-9 p-0"
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" style={{ color: secondaryColor }} />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            )}
            {!isCompleted && questions && (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
                {form.settings.showProgressBar !== false && (
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: primaryColor }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-6 py-4 ${
                      message.role === "user"
                        ? "text-white"
                        : "bg-white border border-gray-200 shadow-sm"
                    }`}
                    style={
                      message.role === "user"
                        ? { backgroundColor: primaryColor }
                        : message.isAdaptive
                        ? { borderColor: secondaryColor, borderWidth: 2 }
                        : {}
                    }
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-medium"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      U
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: delay / 1000,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {isCompleted && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-center"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4 max-w-md shadow-sm">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: `${secondaryColor}20` }}
                  >
                    <Check className="w-8 h-8" style={{ color: secondaryColor }} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">All done!</h3>
                  <p className="text-gray-600">Thanks for completing the form. We'll be in touch soon.</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {!isCompleted && currentQuestion && (
        <div className="border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            {currentQuestion.type === "choice" && currentQuestion.options ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Select an option:</p>
                <RadioGroup
                  onValueChange={(value) => handleSubmitAnswer(value)}
                  disabled={isProcessing}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index}>
                      <RadioGroupItem value={option} id={`option-${index}`} className="peer sr-only" />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-4 hover:bg-gray-50 cursor-pointer peer-data-[state=checked]:bg-opacity-10 transition-all"
                        style={{
                          borderColor: `var(--checked-border, #e5e7eb)`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.setProperty("--checked-border", primaryColor)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.setProperty("--checked-border", "#e5e7eb")
                        }}
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
                  {currentQuestion.type === "textarea" ? (
                    <Textarea
                      ref={inputRef as any}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentQuestion.placeholder || "Type your answer..."}
                      className="min-h-[60px] pr-24 resize-none bg-white rounded-xl"
                      onKeyDown={handleKeyPress}
                      disabled={isProcessing}
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      type={currentQuestion.type === "email" ? "email" : currentQuestion.type === "number" ? "number" : "text"}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentQuestion.placeholder || "Type your answer..."}
                      className="h-14 pr-24 bg-white rounded-xl"
                      onKeyDown={handleKeyPress}
                      disabled={isProcessing}
                    />
                  )}
                  {form.aiConfig?.enableVoice && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleRecording}
                        disabled={isProcessing}
                        className={`h-10 w-10 p-0 rounded-full transition-all ${
                          isRecording ? "text-white" : "hover:bg-gray-100"
                        }`}
                        style={isRecording ? { backgroundColor: primaryColor } : {}}
                        title={isRecording ? "Stop recording" : "Voice input"}
                      >
                        {isRecording ? (
                          <div className="relative">
                            <MicOff className="w-4 h-4" />
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-white"
                              animate={{
                                scale: [1, 1 + audioLevel * 0.5],
                                opacity: [0.5, 0],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleSubmitAnswer(inputValue.trim())}
                  disabled={!inputValue.trim() || isProcessing}
                  className="h-14 px-6 text-white rounded-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            )}

            {!currentQuestion.required && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSubmitAnswer("")}
                  disabled={isProcessing}
                  className="text-gray-500 hover:text-gray-700"
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