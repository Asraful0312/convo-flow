"use client";

import ChatMessages from "@/components/form/ChatMessages";
import CompletionScreen from "@/components/form/CompletionScreen";
import FormHeader from "@/components/form/FormHeader";
import MapConfirmation from "@/components/form/MapConfirmation";
import OverLimitScreen from "@/components/form/OverLimitScreen";
import QuestionInput from "@/components/form/QuestionInput";
import VoiceUI from "@/components/form/VoiceUI";
import WelcomeScreen from "@/components/form/WelcomeScreen";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Message } from "@/lib/form-types";
import confetti from "canvas-confetti";
import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { use, useEffect, useRef, useState, Suspense } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

function FormSubmissionComponent({ formId }: { formId: Id<"forms"> }) {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

  const formData = useQuery(api.forms.getPublicFormData, {
    formId: formId as Id<"forms">,
  });
  const form: any = formData;
  const questions = form?.questions;

  const getResumeData = useQuery(
    api.resume.getResumeData,
    resumeId ? { responseId: resumeId as Id<"responses"> } : "skip",
  );

  const createResponse = useMutation(api.responses.createResponse);
  const updateResponse = useMutation(api.responses.updateResponse);
  const saveAnswer = useMutation(api.answers.saveAnswer);
  const saveConversation = useMutation(api.conversations.saveConversation);
  const getConversationalQuestion = useAction(api.ai.getConversationalQuestion);
  const validateAnswer = useAction(api.ai.validateAnswer);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveProgressAndSendLink = useMutation(
    api.resume.saveProgressAndSendLink,
  );

  const [started, setStarted] = useState(false);
  const [responseId, setResponseId] = useState<Id<"responses"> | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState<string[]>(
    [],
  );
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [locationToConfirm, setLocationToConfirm] = useState<string | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [resumeEmail, setResumeEmail] = useState("");
  const [isSendingLink, setIsSendingLink] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef("");
  const wasRecordingBeforeSpeakRef = useRef<boolean>(false);

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  const primaryColor = form?.settings.branding?.primaryColor || "#F56A4D";
  const secondaryColor = form?.settings.branding?.secondaryColor || "#2EB7A7";
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const askingRef = useRef(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (resumeId && getResumeData) {
      const { conversation, answers } = getResumeData;
      if (conversation && answers) {
        setMessages(conversation.messages as Message[]);
        const newAnswers = answers.reduce((acc, ans) => {
          acc[ans.questionId] = ans.value;
          return acc;
        }, {} as Record<string, any>);
        setAnswers(newAnswers);
        setResponseId(resumeId as Id<"responses">);
        setCurrentQuestionIndex(answers.length);
        setStarted(true);
      }
    }
  }, [resumeId, getResumeData]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const handleStart = async () => {
    if (!form || !questions || resumeId) return;

    if (form.status === "draft") {
      toast.error(
        `Can't start the form in ${form.status} mode please make it public`,
      );
      return;
    }

    setStarted(true);

    const newResponseId = await createResponse({
      formId: formId as Id<"forms">,
      metadata: {
        device: navigator.userAgent,
        browser: navigator.userAgent,
        os: navigator.platform,
      },
    });
    setResponseId(newResponseId);

    const personality = form.aiConfig?.personality || "friendly";
    const welcomeText = getWelcomeMessage(personality, form.title);

    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: welcomeText,
      timestamp: Date.now(),
    };

    setMessages([welcomeMessage]);

    setCurrentQuestionIndex(0);
    askQuestion(0);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = form?.aiConfig?.language || "en-US";

        recognitionRef.current.onresult = (event: any) => {
          if (isSpeakingRef.current || isProcessing) {
            return;
          }

          let interimTranscript = "";
          let finalTranscriptPart = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptPart += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setInputValue(finalTranscriptRef.current + interimTranscript);

          if (finalTranscriptPart) {
            finalTranscriptRef.current += finalTranscriptPart;
            setInputValue(finalTranscriptRef.current);

            if (
              autoSubmit &&
              voiceEnabled &&
              !isSpeakingRef.current &&
              !isProcessing
            ) {
              if (autoSubmitTimeoutRef.current) {
                clearTimeout(autoSubmitTimeoutRef.current);
              }
              autoSubmitTimeoutRef.current = setTimeout(() => {
                const currentTranscript = finalTranscriptRef.current.trim();
                if (
                  currentTranscript &&
                  !isProcessing &&
                  !isSpeakingRef.current
                ) {
                  handleSubmitAnswer(currentTranscript);
                }
              }, 1500);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            return;
          }
          setIsRecording(false);
          stopAudioVisualization();
        };

        recognitionRef.current.onend = () => {
          if (!wasRecordingBeforeSpeakRef.current) {
            setIsRecording(false);
            stopAudioVisualization();
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      stopAudioVisualization();
      if (autoSubmitTimeoutRef.current) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }
    };
  }, [form, autoSubmit, voiceEnabled, isProcessing]);

  useEffect(() => {
    if (form && form.aiConfig?.enableVoice) {
      setVoiceEnabled(true);
    }
  }, [form]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role === "assistant") {
      speakText(lastMessage.content);
    }
  }, [messages]);

  useEffect(() => {
    finalTranscriptRef.current = "";
    setInputValue("");
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
  }, [currentQuestionIndex]);

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const getWelcomeMessage = (personality: string, formTitle: string) => {
    const messages: Record<string, string> = {
      professional: `Good day. I'll guide you through the ${formTitle} form. Shall we begin?`,
      friendly: `Hi! I'm here to help with the ${formTitle}. Ready to get started?`,
      casual: `Hey! Let's breeze through this ${formTitle} together. You ready?`,
      formal: `Greetings. I will assist you in completing the ${formTitle}. May we proceed?`,
    };
    return messages[personality] || messages.friendly;
  };

  const isTextBasedQuestion = (type: string) => {
    const nonTextTypes = [
      "choice",
      "dropdown",
      "rating",
      "scale",
      "likert",
      "file",
      "image_choice",
      "multiple_choice",
    ];
    return !nonTextTypes.includes(type);
  };

  const askQuestion = (index: number, previousAnswer?: string) => {
    if (askingRef.current) return;
    askingRef.current = true;

    if (!questions || index >= questions.length) {
      askingRef.current = false;
      completeForm();
      return;
    }

    const question = questions[index];
    setMultipleChoiceAnswers([]);
    setIsTyping(true);
    setIsProcessing(false);

    setTimeout(async () => {
      let questionText = question.text;
      let isAdaptive = false;

      const historyForAI = messages.map((m) => ({
        role: m.role === "assistant" ? "ai" : "user",
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

      const conversationalText = await getConversationalQuestion({
        question: question.text,
        history: historyForAI as any,
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
      };

      setMessages((prev) => [...prev, questionMessage]);

      setIsTyping(false);
      inputRef.current?.focus();

      askingRef.current = false;
    }, 800);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

      await handleSubmitAnswer({
        storageId,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleChoiceChange = (checked: boolean, option: string) => {
    setMultipleChoiceAnswers((prev) => {
      const updated = checked
        ? [...prev, option]
        : prev.filter((item) => item !== option);
      return updated.filter((item): item is string => typeof item === "string");
    });
  };

  const handleLocationConfirmation = (isCorrect: boolean) => {
    if (isCorrect) {
      handleSubmitAnswer(locationToConfirm!, true);
    } else {
      setLocationToConfirm(null);
      const tryAgainMessage: Message = {
        id: `try-again-${Date.now()}`,
        role: "assistant",
        content: "No problem. Please enter the address again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, tryAgainMessage]);
    }
  };

  useEffect(() => {
    if (!isSpeaking && wasRecordingBeforeSpeakRef.current && voiceEnabled) {
      const timer = setTimeout(() => {
        if (recognitionRef.current && !isProcessing && !isTyping) {
          try {
            recognitionRef.current.start();
            setIsRecording(true);
            startAudioVisualization();
            wasRecordingBeforeSpeakRef.current = false;
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isSpeaking, voiceEnabled, isProcessing, isTyping]);

  const handleSubmitAnswer = async (
    answer:
      | string
      | string[]
      | { storageId: string; fileName: string; fileSize: number }
      | { imageUrl: string; text: string },
    isConfirmed: boolean = false,
  ) => {
    if (
      currentQuestion?.required &&
      (answer === "" || (Array.isArray(answer) && answer.length === 0))
    ) {
      toast.error("This question is required.");
      return;
    }

    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }

    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        stopAudioVisualization();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    }

    finalTranscriptRef.current = "";
    setInputValue("");

    if (!currentQuestion || isProcessing) return;

    if (currentQuestion.type === "image_choice" && typeof answer === "string") {
      const option = currentQuestion.options?.find(
        (opt: any) => typeof opt === "object" && opt.text === answer,
      );
      if (option) {
        answer = option as any;
      }
    }

    if (
      currentQuestion.type === "location" &&
      typeof answer === "string" &&
      !isConfirmed
    ) {
      setLocationToConfirm(answer);
      const userMessage: Message = {
        id: `a-${currentQuestion._id}`,
        role: "user",
        content: answer,
        timestamp: Date.now(),
        questionId: currentQuestion._id,
      };
      const assistantMessage: Message = {
        id: `map-check-${Date.now()}`,
        role: "assistant",
        content: "OK, let's check this location. Is this correct?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      return;
    }

    setIsProcessing(true);

    if (
      typeof answer === "string" &&
      answer.trim() &&
      !["choice", "dropdown", "rating", "scale", "likert"].includes(
        currentQuestion.type,
      )
    ) {
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
        setMessages((prev) => [...prev, errorMessage]);
        setIsProcessing(false);
        inputRef.current?.focus();
        return;
      }
    }

    try {
      if (!responseId) {
        throw new Error("Response ID not found");
      }

      let answerValue: any = answer;
      let fileDetails: { fileName?: string; fileSize?: number } = {};
      let displayContent: string;
      let messageValue: any = undefined;

      if (typeof answer === "object" && "storageId" in answer) {
        answerValue = answer.storageId;
        fileDetails = { fileName: answer.fileName, fileSize: answer.fileSize };
        displayContent = answer.fileName;
      } else if (currentQuestion.type === "image_choice") {
        if (typeof answer === "string") {
          const option = currentQuestion.options?.find(
            (opt: any) => typeof opt === "object" && opt.text === answer,
          );
          answerValue = option || answer;
          displayContent = answer;
          messageValue = option;
        } else if (
          typeof answer === "object" &&
          answer !== null &&
          (answer as any).imageUrl
        ) {
          answerValue = answer;
          displayContent = (answer as any).text;
          messageValue = answer;
        } else {
          displayContent = "";
        }
      } else if (Array.isArray(answer)) {
        displayContent = answer.join(", ");
      } else if (answer === "") {
        displayContent = "Skip this question";
      } else {
        displayContent = answer;
      }

      if (
        currentQuestion.text.toLowerCase().includes("name") &&
        !currentQuestion.text.toLowerCase().includes("company") &&
        typeof answer === "string"
      ) {
        setUserName(answer);
      }

      await saveAnswer({
        responseId: responseId,
        questionId: currentQuestion._id,
        value: answerValue,
        ...fileDetails,
      });

      setAnswers((prev) => ({ ...prev, [currentQuestion._id]: answer }));

      if (currentQuestion.type !== "location" || isConfirmed) {
        const answerMessage: Message = {
          id: `a-${currentQuestion._id}`,
          role: "user",
          content: displayContent,
          timestamp: Date.now(),
          questionId: currentQuestion._id,
          value: messageValue,
        };
        setMessages((prev) => [...prev, answerMessage]);
      }

      if (locationToConfirm) setLocationToConfirm(null);

      setCurrentQuestionIndex((prev) => {
        const nextIndex = prev + 1;
        if (!voiceEnabled) {
          askQuestion(nextIndex, displayContent);
        } else {
          setTimeout(() => {
            askQuestion(nextIndex, displayContent);
          }, 500);
        }
        return nextIndex;
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      setIsProcessing(false);
    }
  };

  const completeForm = async () => {
    if (!responseId) return;

    setIsTyping(true);

    try {
      await saveConversation({
        responseId,
        messages: messagesRef.current,
      });
      await updateResponse({
        responseId,
        status: "completed",
      });
      setIsCompleted(true);
    } catch (error) {
      console.error("Error completing form:", error);
      setIsTyping(false);
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled) return;

    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    if (recognitionRef.current && isRecording) {
      try {
        wasRecordingBeforeSpeakRef.current = true;
        recognitionRef.current.stop();
        setIsRecording(false);
        stopAudioVisualization();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    } else {
      wasRecordingBeforeSpeakRef.current = false;
    }

    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }

    try {
      const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

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
          },
        );

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          audioElementRef.current = new Audio(audioUrl);
          audioElementRef.current.onended = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
          };
          await audioElementRef.current.play();
          return;
        }
      }

      if (typeof window !== "undefined") {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  useEffect(() => {
    if (isCompleted) {
      const showCompletionUI = async () => {
        const personality = form?.aiConfig?.personality || "friendly";
        const completionMessages: Record<string, string> = {
          professional:
            "Thank you for completing the form. Your responses have been recorded.",
          friendly:
            "All set! Thanks for taking the time to fill this out. We'll be in touch soon!",
          casual: "Done! Thanks for the chat. Catch you later!",
          formal:
            "Your submission has been successfully recorded. Thank you for your participation.",
        };

        await new Promise((resolve) => setTimeout(resolve, 800));

        const completionMessage: Message = {
          id: "complete",
          role: "assistant",
          content:
            completionMessages[personality] || completionMessages.friendly,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, completionMessage]);
        setIsTyping(false);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [primaryColor, secondaryColor, "#A3E635"],
        });
      };
      showCompletionUI();
    }
  }, [isCompleted, form, primaryColor, secondaryColor]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      inputValue.trim() &&
      !isProcessing
    ) {
      e.preventDefault();
      handleSubmitAnswer(inputValue.trim());
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser");
      return;
    }
    if (isSpeakingRef.current) {
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      stopAudioVisualization();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      startAudioVisualization();
    }
  };
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsSpeaking(false);
    }
  };

  const handleSendResumeLink = async () => {
    if (!resumeEmail || !responseId) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSendingLink(true);
    try {
      const baseUrl = window.location.origin;
      await saveProgressAndSendLink({
        responseId,
        email: resumeEmail,
        baseUrl,
        messages: messagesRef.current,
      });
      toast.success(
        "A link to resume your session has been sent to your email.",
      );
      setIsSaveModalOpen(false);
      setResumeEmail("");
    } catch (error) {
      toast.error("Failed to send resume link. Please try again.");
      console.error(error);
    } finally {
      setIsSendingLink(false);
    }
  };

  if (!form)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  if (formData?.isOverResponseLimit)
    return <OverLimitScreen primaryColor={primaryColor} form={form} />;

  if (!started && !resumeId) return <WelcomeScreen form={form} onStart={handleStart} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FormHeader
        form={form}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions?.length || 0}
        progress={progress}
        isCompleted={isCompleted}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
        allowSaveAndResume={form.settings?.allowSaveAndResume}
        onSave={() => setIsSaveModalOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <ChatMessages messages={messages} form={form} isTyping={isTyping} />
          {isCompleted && <CompletionScreen secondaryColor={secondaryColor} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isCompleted && currentQuestion && !isTyping && !isProcessing && (
        <div className="border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            {locationToConfirm ? (
              <MapConfirmation
                address={locationToConfirm}
                onConfirm={handleLocationConfirmation}
              />
            ) : voiceEnabled &&
              currentQuestion &&
              isTextBasedQuestion(currentQuestion.type) ? (
              <div className="flex flex-col items-center space-y-4">
                <VoiceUI
                  audioLevel={audioLevel}
                  isRecording={isRecording}
                  isSpeaking={isSpeaking}
                  transcript={inputValue}
                  onToggleRecording={toggleRecording}
                  question={currentQuestion.text}
                  isProcessing={isProcessing}
                  isTyping={isTyping}
                  onSubmit={() => handleSubmitAnswer(inputValue)}
                  primaryColor={primaryColor}
                />
                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="auto-submit-switch"
                    checked={autoSubmit}
                    onCheckedChange={setAutoSubmit}
                  />
                  <Label htmlFor="auto-submit-switch">Auto-submit answer</Label>
                </div>
              </div>
            ) : (
              <QuestionInput
                audioLevel={audioLevel}
                isRecording={isRecording}
                onToggleRecording={toggleRecording}
                voiceEnabled={voiceEnabled}
                question={currentQuestion}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSubmit={handleSubmitAnswer}
                isProcessing={isProcessing}
                isUploading={isUploading}
                isTyping={isTyping}
                multipleChoiceAnswers={multipleChoiceAnswers}
                onMultipleChoiceChange={handleMultipleChoiceChange}
                primaryColor={primaryColor}
                onFileChange={handleFileChange}
                onKeyPress={handleKeyPress}
              />
            )}
          </div>
        </div>
      )}
      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your progress</DialogTitle>
            <DialogDescription>
              Enter your email below to receive a link to resume this form
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="resume-email">Email Address</Label>
            <Input
              id="resume-email"
              type="email"
              value={resumeEmail}
              onChange={(e) => setResumeEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendResumeLink} disabled={isSendingLink}>
              {isSendingLink ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Send Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FormSubmissionPageWrapper({
  params,
}: {
  params: { formId: string };
}) {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <FormSubmissionComponent formId={params.formId as Id<"forms">} />
    </Suspense>
  );
}
