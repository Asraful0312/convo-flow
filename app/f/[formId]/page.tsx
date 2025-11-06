"use client"

import React, { useState, useEffect, useRef, use } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import OverLimitScreen from "@/components/form/OverLimitScreen"
import WelcomeScreen from "@/components/form/WelcomeScreen"
import FormHeader from "@/components/form/FormHeader"
import ChatMessages from "@/components/form/ChatMessages"
import CompletionScreen from "@/components/form/CompletionScreen"
import QuestionInput from "@/components/form/QuestionInput"
import { Loader2 } from "lucide-react"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: number
  questionId?: string
  isAdaptive?: boolean
}

export default function FormSubmissionPage({ params }: { params: { formId: string } }) {
  const { formId } = use<any>(params as any);
  
  const formData = useQuery(api.forms.getPublicFormData, { formId: formId as Id<"forms"> })
  const form: any = formData
  const questions = form?.questions

  const createResponse = useMutation(api.responses.createResponse)
  const updateResponse = useMutation(api.responses.updateResponse)
  const saveAnswer = useMutation(api.answers.saveAnswer)
  const saveConversation = useMutation(api.conversations.saveConversation)
  const getConversationalQuestion = useAction(api.ai.getConversationalQuestion)
  const validateAnswer = useAction(api.ai.validateAnswer)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [started, setStarted] = useState(false)
  const [responseId, setResponseId] = useState<Id<"responses"> | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false);
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const currentQuestion = questions?.[currentQuestionIndex]
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const primaryColor = form?.settings.branding?.primaryColor || "#F56A4D"
  const secondaryColor = form?.settings.branding?.secondaryColor || "#2EB7A7"


  console.log("questions", questions)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  const speakText = async (text: string) => {
    if (!voiceEnabled) return

    setIsSpeaking(true)

    try {
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

  const getWelcomeMessage = (personality: string, formTitle: string) => {
    const messages: Record<string, string> = {
      professional: `Good day. I'll guide you through the ${formTitle} form. Shall we begin?`,
      friendly: `Hi! I'm here to help with the ${formTitle}. Ready to get started?`,
      casual: `Hey! Let's breeze through this ${formTitle} together. You ready?`,
      formal: `Greetings. I will assist you in completing the ${formTitle}. May we proceed?`,
    }
    return messages[personality] || messages.friendly
  }

  const askQuestion = (index: number) => {
    if (!questions || index >= questions.length) {
      completeForm()
      return
    }

    const question = questions[index]
    setMultipleChoiceAnswers([]); // Reset for next question
    setIsTyping(true)

    setTimeout(async () => {
      let questionText = question.text;
      let isAdaptive = false;

      const historyForAI = messages.map((m) => ({
          role: m.role === "assistant" ? ("ai" as const) : ("user" as const),
          content: m.content,
      }));

      const previousQuestionIndex = index - 1;
      let previousAnswer: string | undefined = undefined;
      if (previousQuestionIndex >= 0) {
        const previousQuestion = questions[previousQuestionIndex];
        const prevAnswerValue = answers[previousQuestion._id];
        if (prevAnswerValue) {
            if (Array.isArray(prevAnswerValue)) {
                previousAnswer = prevAnswerValue.join(', ');
            } else if (typeof prevAnswerValue === 'object' && prevAnswerValue.fileName) {
                previousAnswer = prevAnswerValue.fileName;
            } else {
                previousAnswer = String(prevAnswerValue);
            }
        }
      }

      const conversationalText = await getConversationalQuestion({
          question: question.text,
          history: historyForAI,
          personality: form?.aiConfig?.personality || "friendly",
          userName: userName || undefined,
          previousAnswer,
      });

      if (conversationalText) {
          questionText = conversationalText;
          isAdaptive = conversationalText !== question.text;
      }

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      await handleSubmitAnswer({ storageId, fileName: file.name, fileSize: file.size });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("File upload failed. Please try again.")
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleChoiceChange = (checked: boolean, option: string) => {
    setMultipleChoiceAnswers(prev => {
        if (checked) {
            return [...prev, option];
        } else {
            return prev.filter(item => item !== option);
        }
    });
  };

  const handleSubmitAnswer = async (answer: string | string[] | { storageId: string, fileName: string, fileSize: number }) => {
    if (!currentQuestion || isProcessing) return

    setIsProcessing(true)

    if (typeof answer === 'string' && answer.trim() && !['choice', 'dropdown', 'rating', 'scale', 'likert'].includes(currentQuestion.type)) {
        const validation = await validateAnswer({
            question: currentQuestion.text,
            answer: answer,
            personality: form?.aiConfig?.personality || "friendly",
        });

        if (validation && !validation.isValid) {
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                role: "assistant",
                content: validation.reason,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
            await speakText(validation.reason);
            setIsProcessing(false);
            inputRef.current?.focus();
            return;
        }
    }

    try {
      let currentResponseId = responseId

      if (!currentResponseId) {
        const newResponseId = await createResponse({
          formId: formId as Id<"forms">,
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

      let answerValue: any = answer;
      let fileDetails: { fileName?: string, fileSize?: number } = {};
      let displayContent: string;

      if (typeof answer === 'object' && 'storageId' in answer) {
        answerValue = answer.storageId;
        fileDetails = { fileName: answer.fileName, fileSize: answer.fileSize };
        displayContent = answer.fileName;
      } else if (Array.isArray(answer)) {
        displayContent = answer.join(", ");
      } else if (answer === "") {
        displayContent = "Skip this question";
      } else {
        displayContent = answer;
      }

      if (currentQuestion.text.toLowerCase().includes("name") && 
          !currentQuestion.text.toLowerCase().includes("company") && 
          typeof answer === 'string') {
        setUserName(answer);
      }

      await saveAnswer({
        responseId: currentResponseId,
        questionId: currentQuestion._id,
        value: answerValue,
        ...fileDetails
      })

      setAnswers((prev) => ({ ...prev, [currentQuestion._id]: answer }))

      const answerMessage: Message = {
        id: `a-${currentQuestion._id}`,
        role: "user",
        content: displayContent,
        timestamp: Date.now(),
        questionId: currentQuestion._id,
      }

      const newMessages = [...messages, answerMessage]
      setMessages(newMessages)
      setInputValue("")

      await saveConversation({
        responseId: currentResponseId,
        messages: newMessages,
        aiContext: {
          currentQuestionIndex,
          answeredQuestions: Object.keys({ ...answers, [currentQuestion._id]: answer }),
          skippedQuestions: [],
        },
      })

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

  const completeForm = async () => {
    if (!responseId) return

    setIsTyping(true)

    try {
      await updateResponse({
        responseId,
        status: "completed",
      })
      setIsCompleted(true)
    } catch (error) {
      console.error("Error completing form:", error)
      setIsTyping(false)
    }
  }

  useEffect(() => {
    if (isCompleted) {
      const showCompletionUI = async () => {
        const personality = form?.aiConfig?.personality || "friendly"
        const completionMessages: Record<string, string> = {
          professional: "Thank you for completing the form. Your responses have been recorded.",
          friendly: "All set! Thanks for taking the time to fill this out. We'll be in touch soon!",
          casual: "Done! Thanks for the chat. Catch you later!",
          formal: "Your submission has been successfully recorded. Thank you for your participation.",
        }

        await new Promise((resolve) => setTimeout(resolve, 800))

        const completionMessage: Message = {
          id: "complete",
          role: "assistant",
          content: completionMessages[personality] || completionMessages.friendly,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, completionMessage])
        setIsTyping(false)
        await speakText(completionMessage.content)

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [primaryColor, secondaryColor, "#A3E635"],
        })
      }
      showCompletionUI()
    }
  }, [isCompleted, form, primaryColor, secondaryColor])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && inputValue.trim() && !isProcessing) {
      e.preventDefault()
      handleSubmitAnswer(inputValue.trim())
    }
  }



  if (!form) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (formData?.isOverResponseLimit) return <OverLimitScreen primaryColor={primaryColor} form={form} />;

  if (!started) return <WelcomeScreen form={form} onStart={handleStart} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormHeader
        form={form}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions?.length || 0}
        progress={progress}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
        isCompleted={isCompleted}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <ChatMessages messages={messages} form={form} isTyping={isTyping} />
          {isCompleted && <CompletionScreen secondaryColor={secondaryColor} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isCompleted && currentQuestion && (
        <div className="border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            <QuestionInput
              question={currentQuestion}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmit={handleSubmitAnswer}
              isProcessing={isProcessing}
              isUploading={isUploading}
              multipleChoiceAnswers={multipleChoiceAnswers}
              onMultipleChoiceChange={handleMultipleChoiceChange as any}
              primaryColor={primaryColor}
              voiceEnabled={voiceEnabled}
              isRecording={isRecording}
              audioLevel={audioLevel}
              onToggleRecording={toggleRecording}
              onFileChange={handleFileChange}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      )}
    </div>
  )
}
