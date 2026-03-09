"use client";

import ChatMessages from "@/components/form/ChatMessages";
import CompletionScreen from "@/components/form/CompletionScreen";
import FormHeader from "@/components/form/FormHeader";
import MapConfirmation from "@/components/form/MapConfirmation";
import OverLimitScreen from "@/components/form/OverLimitScreen";
import QuestionInput from "@/components/form/QuestionInput";
import SaveResumeModal from "@/components/form/SaveResumeModal";
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
import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function FormSubmissionComponent({
  params,
}: {
  params: { formId: string };
}) {
  const { formId } = use<any>(params as any);
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get("resume");

  const formData = useQuery(api.forms.getPublicFormData, {
    formId: formId as Id<"forms">,
  });
  const form: any = formData;
  const questions = form?.questions;

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
  const resumeData = useQuery(
    api.resume.getResumeData,
    resumeToken ? { responseId: resumeToken as Id<"responses"> } : "skip",
  );

  const [started, setStarted] = useState(false);
  const [responseId, setResponseId] = useState<Id<"responses"> | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
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
  const [isOffline, setIsOffline] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    fileSize: number;
    storageId: string;
  } | null>(null);
  const [locationData, setLocationData] = useState<null | any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autosave hook
  const useLocalStorage = (key: string, initialValue: any) => {
    const [storedValue, setStoredValue] = useState(() => {
      if (typeof window === "undefined") {
        return initialValue;
      }
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.log(error);
        return initialValue;
      }
    });

    const setValue = (value: any) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.log(error);
      }
    };
    return [storedValue, setValue];
  };

  const [savedState, setSavedState] = useLocalStorage(
    `candid-form-${formId}`,
    null,
  );

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
  const backgroundColor = form?.settings.branding?.backgroundColor || "#ffffff";
  const font = form?.settings.branding?.font || "Inter";

  console.log("THEME DEBUG:", {
    primaryColor,
    secondaryColor,
    backgroundColor,
    font,
    settings: form?.settings,
  });

  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty(
        "--candid-coral",
        primaryColor,
      );
      document.documentElement.style.setProperty("--primary", primaryColor);
      document.documentElement.style.setProperty(
        "--color-primary",
        primaryColor,
      );
      document.documentElement.style.setProperty(
        "--primary-foreground",
        "#ffffff",
      );
      document.documentElement.style.setProperty("--ring", primaryColor);
      document.documentElement.style.setProperty("--color-ring", primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty("--secondary", secondaryColor);
      document.documentElement.style.setProperty(
        "--color-secondary",
        secondaryColor,
      );
    }
    if (backgroundColor) {
      document.documentElement.style.setProperty(
        "--background",
        backgroundColor,
      );
      document.documentElement.style.setProperty(
        "--color-background",
        backgroundColor,
      );
    }
    if (font) {
      document.documentElement.style.setProperty("--font-sans", font);
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
      document.body.style.fontFamily = `"${font}", sans-serif`;
    }

    return () => {
      document.documentElement.style.removeProperty("--candid-coral");
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--color-primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--color-ring");
      document.documentElement.style.removeProperty("--secondary");
      document.documentElement.style.removeProperty("--color-secondary");
      document.documentElement.style.removeProperty("--background");
      document.documentElement.style.removeProperty("--color-background");
      document.documentElement.style.removeProperty("--font-sans");
      document.body.style.fontFamily = "";
    };
  }, [primaryColor, secondaryColor, backgroundColor, font]);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const askingRef = useRef(false);

  const messagesRef = useRef<Message[]>([]);
  const handleSubmitAnswerRef = useRef<any>(null);

  const isResuming = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOffline(!navigator.onLine);

    // Fetch location
    const fetchLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_name) {
          setLocationData({
            country: data.country_name,
            city: data.city,
            region: data.region,
          });
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      }
    };
    fetchLocation();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Backfill location if it arrives after response creation
  useEffect(() => {
    if (locationData && responseId) {
      updateResponse({
        responseId,
        metadata: {
          device: navigator.userAgent,
          browser: navigator.userAgent,
          os: navigator.platform,
          location: locationData as any,
        },
      }).catch((e) => console.error("Failed to update location:", e));
    }
  }, [locationData, responseId]);

  // Autosave effect
  useEffect(() => {
    if (!isCompleted && messages.length > 0 && responseId) {
      setSavedState({
        messages,
        responseId,
        currentQuestionIndex,
        answers: getAllAnswers(messages),
        timestamp: Date.now(),
      });
    }
  }, [messages, responseId, currentQuestionIndex, isCompleted]);

  const getAllAnswers = (currentMessages = messages) => {
    const answers: Record<string, any> = {};
    currentMessages.forEach((m) => {
      if (m.role === "user" && m.questionId && m.value !== undefined) {
        answers[m.questionId] = m.value;
      }
    });
    return answers;
  };

  const evaluateCondition = (condition: any, answerValue: any) => {
    if (answerValue === undefined || answerValue === null) return false;

    switch (condition.operator) {
      case "equals":
        return answerValue == condition.value;
      case "not_equals":
        return answerValue != condition.value;
      case "contains":
        return (
          typeof answerValue === "string" &&
          answerValue.toLowerCase().includes(condition.value.toLowerCase())
        );
      case "greater_than":
        return Number(answerValue) > Number(condition.value);
      case "less_than":
        return Number(answerValue) < Number(condition.value);
      default:
        return false;
    }
  };

  const shouldShowQuestion = (
    question: any,
    allAnswers: Record<string, any>,
  ) => {
    if (!question.conditionalLogic || !question.conditionalLogic.enabled) {
      return true;
    }

    const { conditions, action } = question.conditionalLogic;
    if (!conditions || conditions.length === 0) return true;

    // AND logic for now
    const allConditionsMet = conditions.every((condition: any) => {
      const answerValue = allAnswers[condition.questionId];
      return evaluateCondition(condition, answerValue);
    });

    if (action === "hide" || action === "skip") {
      return !allConditionsMet;
    }
    // action === "show"
    return allConditionsMet;
  };

  useEffect(() => {
    if (resumeData && questions && !isResuming.current) {
      isResuming.current = true; // prevent re-running

      setStarted(true);
      setResponseId(resumeToken as Id<"responses">);

      const conversationMessages = resumeData.conversation?.messages || [];
      setMessages(conversationMessages);
      messagesRef.current = conversationMessages;

      if (resumeData.answers) {
        const newAnswers: Record<string, any> = {};
        resumeData.answers.forEach((answer: any) => {
          newAnswers[answer.questionId] = answer.value;
          if (
            questions
              .find((q: any) => q._id === answer.questionId)
              ?.text.toLowerCase()
              .includes("name")
          ) {
            setUserName(answer.value);
          }
        });
      }

      const lastUserMessageWithQuestion = [...conversationMessages]
        .reverse()
        .find((m: Message) => m.role === "user" && m.questionId);

      let nextQuestionIndex = 0;
      if (lastUserMessageWithQuestion) {
        const lastQuestionIndex = questions.findIndex(
          (q: any) => q._id === lastUserMessageWithQuestion.questionId,
        );
        if (lastQuestionIndex !== -1) {
          nextQuestionIndex = lastQuestionIndex + 1;
        }
      }

      // Logic check for resume
      const currentAnswers = getAllAnswers(conversationMessages);
      while (
        nextQuestionIndex < questions.length &&
        !shouldShowQuestion(questions[nextQuestionIndex], currentAnswers)
      ) {
        nextQuestionIndex++;
      }

      if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
        if (conversationMessages.length > 0) {
          if (!form?.aiConfig?.enableVoice) {
            setTimeout(() => askQuestion(nextQuestionIndex), 500);
          }
        } else {
          handleStart();
        }
      } else if (questions.length > 0) {
        completeForm();
      }
    }
  }, [resumeData, questions, resumeToken, form?.aiConfig?.enableVoice]);

  const handleSaveProgress = async (email: string) => {
    let currentResponseId = responseId;
    if (!currentResponseId) {
      const newResponseId = await createResponse({
        formId: formId as Id<"forms">,
        metadata: {
          device: navigator.userAgent,
          browser: navigator.userAgent,
          os: navigator.platform,
          location: locationData || undefined,
        },
      });
      setResponseId(newResponseId);
      currentResponseId = newResponseId;
    }

    if (!currentResponseId) {
      throw new Error(
        "Could not create or get a response ID to save progress.",
      );
    }

    await saveProgressAndSendLink({
      responseId: currentResponseId,
      email,
      baseUrl: window.location.origin,
      messages: messagesRef.current,
    });
  };

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const handleStart = async () => {
    if (isResuming.current || !form || !questions) return;

    if (form.status === "draft") {
      toast.error(
        `Can't start the form in ${form.status} mode please make it public`,
      );
      return;
    }

    // Check for local save
    if (savedState && savedState.messages && savedState.messages.length > 0) {
      const shouldRestore = window.confirm(
        "We found a saved session. Would you like to restore it?",
      );
      if (shouldRestore) {
        setStarted(true);
        setResponseId(savedState.responseId);
        setMessages(savedState.messages);
        messagesRef.current = savedState.messages;
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        if (savedState.answers) {
          // Restore user name if available
          const nameQ = questions.find((q: any) =>
            q.text.toLowerCase().includes("name"),
          );
          if (nameQ && savedState.answers[nameQ._id]) {
            setUserName(savedState.answers[nameQ._id]);
          }
        }
        // Check if the last message was already asking this question
        const lastMessage = savedState.messages[savedState.messages.length - 1];
        const currentQuestion = questions[savedState.currentQuestionIndex];

        const alreadyAsked =
          lastMessage &&
          lastMessage.role === "assistant" &&
          lastMessage.questionId === currentQuestion._id;

        if (!alreadyAsked) {
          // Ask next question after a delay
          setTimeout(() => {
            askQuestion(savedState.currentQuestionIndex);
          }, 500);
        }
        return;
      }
    }

    setStarted(true);

    const personality = form.aiConfig?.personality || "friendly";
    const welcomeText = getWelcomeMessage(personality, form.title);

    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: welcomeText,
      timestamp: Date.now(),
    };

    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];

    // Find first visible question
    let firstIndex = 0;
    const currentAnswers = getAllAnswers([welcomeMessage]);
    while (
      firstIndex < questions.length &&
      !shouldShowQuestion(questions[firstIndex], currentAnswers)
    ) {
      firstIndex++;
    }

    if (firstIndex >= questions.length) {
      completeForm();
      return;
    }

    setCurrentQuestionIndex(firstIndex);
    askQuestion(firstIndex);
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
          // If assistant is speaking or processing, ignore recognition results
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

          // Format voice transcript based on question type
          const formatVoiceTranscript = (
            text: string,
            questionType?: string,
          ): string => {
            if (!text) return text;

            // For email questions: remove spaces, lowercase, common voice replacements
            if (questionType === "email") {
              return text
                .toLowerCase()
                .replace(/\s+/g, "") // Remove all spaces
                .replace(/\bat\b/gi, "@") // "at" -> @
                .replace(/\bdot\b/gi, ".") // "dot" -> .
                .replace(/\bunderscore\b/gi, "_") // "underscore" -> _
                .replace(/\bdash\b/gi, "-") // "dash" -> -
                .replace(/gmail\.com/gi, "gmail.com") // Fix common domains
                .replace(/yahoo\.com/gi, "yahoo.com")
                .replace(/hotmail\.com/gi, "hotmail.com")
                .replace(/outlook\.com/gi, "outlook.com");
            }

            // For URL questions: remove spaces, add common replacements
            if (questionType === "url") {
              return text
                .toLowerCase()
                .replace(/\s+/g, "") // Remove all spaces
                .replace(/\bdot\b/gi, ".") // "dot" -> .
                .replace(/\bslash\b/gi, "/") // "slash" -> /
                .replace(/\bdash\b/gi, "-"); // "dash" -> -
            }

            // For phone questions: keep only numbers and common phone chars
            if (questionType === "phone") {
              return text.replace(/[^\d\s\-\+\(\)]/g, "");
            }

            return text;
          };

          const currentQuestionType = questions?.[currentQuestionIndex]?.type;

          // Update UI with interim transcript for live feedback
          const displayText = formatVoiceTranscript(
            finalTranscriptRef.current + interimTranscript,
            currentQuestionType,
          );
          setInputValue(displayText);

          if (finalTranscriptPart) {
            // Format and store the final transcript
            const formattedFinal = formatVoiceTranscript(
              finalTranscriptPart,
              currentQuestionType,
            );
            finalTranscriptRef.current = formatVoiceTranscript(
              finalTranscriptRef.current + formattedFinal,
              currentQuestionType,
            );
            setInputValue(finalTranscriptRef.current);

            // Only auto-submit if conditions are met
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
                  if (handleSubmitAnswerRef.current) {
                    handleSubmitAnswerRef.current(currentTranscript);
                  }
                }
              }, 1500);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            // Ignore no-speech errors, keep recording
            return;
          }
          setIsRecording(false);
          stopAudioVisualization();
        };

        recognitionRef.current.onend = () => {
          // Only set recording to false if we're not supposed to restart
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

  // Clear transcripts whenever we move to a new question to avoid leftover auto submits
  useEffect(() => {
    finalTranscriptRef.current = "";
    setInputValue("");
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      professional: `Hello. I will guide you through the ${formTitle}. Shall we begin?`,
      friendly: `Hi there! I'm here to help you with the ${formTitle}. Ready to jump in?`,
      casual: `Hey! Let's breeze through this ${formTitle} together. You ready?`,
      formal: `Greetings. I will assist you in completing the ${formTitle}. May we proceed?`,
    };
    return messages[personality] || messages.friendly;
  };

  // ... (skip to completion messages)

  const completionMessages: Record<string, string> = {
    professional: "Submission received. Thank you for your detailed responses.",
    friendly: "All done! You're a star. Thanks for your time!",
    casual: "Done! Thanks for the chat. Catch you later!",
    formal:
      "Your submission has been successfully recorded. Thank you for your participation.",
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
    if (askingRef.current) return; // already asking
    if (!questions || index >= questions.length) {
      return;
    }
    askingRef.current = true; // 🔥 lock it immediately

    const question = questions[index];
    setMultipleChoiceAnswers([]);
    setPendingFile(null);
    setIsTyping(true);
    setIsProcessing(false);

    setTimeout(async () => {
      let questionText = question.text;
      let isAdaptive = false;

      const historyForAI = messages.map((m) => ({
        role: m.role === "assistant" ? "ai" : "user",
        content: m.content,
      }));

      try {
        const conversationalText = await getConversationalQuestion({
          question: question.text,
          history: historyForAI as any,
          personality: form?.aiConfig?.personality || "friendly",
          userName: userName || undefined,
          previousAnswer,
          responseId: responseId || undefined,
        });

        if (conversationalText) {
          questionText = conversationalText;
          isAdaptive = conversationalText !== question.text;
        }
      } catch (error: any) {
        // On rate limit or error, just use the original question text
        // Log but don't show error - the form can still work with original text
        console.error("Error getting conversational question:", error);
      }

      const questionMessage: Message = {
        id: `q-${question._id}`,
        role: "assistant",
        content: questionText,
        timestamp: Date.now(),
        questionId: question._id,
        isAdaptive,
      };

      setMessages((prev) => {
        const newMessages = [...prev, questionMessage];
        messagesRef.current = newMessages;
        return newMessages;
      });

      setIsTyping(false);
      inputRef.current?.focus();

      askingRef.current = false; // 🔥 unlock when ready
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

      setPendingFile({
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

  const handleRemoveFile = () => {
    setPendingFile(null);
  };

  const handleSubmitFile = () => {
    if (pendingFile) {
      handleSubmitAnswer(pendingFile);
    }
  };

  const handleMultipleChoiceChange = (checked: boolean, option: string) => {
    setMultipleChoiceAnswers((prev) => {
      const updated = checked
        ? [...prev, option]
        : prev.filter((item) => item !== option);

      // ✅ Filter out stray booleans or invalid items
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
      setMessages((prev) => {
        const newMessages = [...prev, tryAgainMessage];
        messagesRef.current = newMessages;
        return newMessages;
      });
    }
  };

  useEffect(() => {
    // When assistant stops speaking, restart recording if it was active before
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
      }, 500); // Small delay to ensure audio has finished

      return () => clearTimeout(timer);
    }
  }, [isSpeaking, voiceEnabled, isProcessing, isTyping]);

  // Update the handleSubmitAnswer function
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

    // Clear auto-submit timeout
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }

    // Stop recording immediately
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        stopAudioVisualization();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    }

    // Clear transcript
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
      setMessages((prev) => {
        const newMessages = [...prev, userMessage, assistantMessage];
        messagesRef.current = newMessages;
        return newMessages;
      });
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
      try {
        const validation = await validateAnswer({
          question: currentQuestion.text,
          answer: answer,
          rules: currentQuestion.validation,
          responseId: responseId || undefined,
        });

        if (!validation.isValid) {
          setIsProcessing(false);
          // Use AI's conversational 'reason' field, with a friendly fallback
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              validation.reason ||
              "Hmm, that doesn't seem quite right. Could you try answering that again?",
            timestamp: Date.now(),
          };
          setMessages((prev) => {
            const newMessages = [...prev, errorMessage];
            messagesRef.current = newMessages;
            return newMessages;
          });
          // Note: speakText is called automatically by the useEffect that watches messages
          return;
        }
      } catch (error: any) {
        setIsProcessing(false);
        // Handle rate limit or other errors with a friendly message
        const errorContent =
          error?.data?.includes?.("Too many requests") ||
          error?.message?.includes?.("rate limit")
            ? "I'm getting a lot of requests right now! Please wait a moment and try again. 😊"
            : "Oops, something went wrong on my end. Let me try that again in a moment.";

        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errorContent,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const newMessages = [...prev, errorMessage];
          messagesRef.current = newMessages;
          return newMessages;
        });
        // Note: speakText is called automatically by the useEffect that watches messages
        return;
      }
    }

    // Optimistic update
    const userMessage: Message = {
      id: `a-${currentQuestion._id}`,
      role: "user",
      content:
        typeof answer === "string"
          ? answer === ""
            ? "Skipped"
            : answer
          : Array.isArray(answer)
            ? answer.join(", ")
            : typeof answer === "object" && "fileName" in answer
              ? `Uploaded ${answer.fileName}`
              : typeof answer === "object" && "imageUrl" in answer
                ? `Selected ${answer.text}`
                : JSON.stringify(answer),
      timestamp: Date.now(),
      questionId: currentQuestion._id,
      value: answer,
    };

    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setInputValue("");

    // Ensure we have a response ID
    let currentResponseId = responseId;
    if (!currentResponseId) {
      try {
        const newResponseId = await createResponse({
          formId: formId as Id<"forms">,
          metadata: {
            device: navigator.userAgent,
            browser: navigator.userAgent,
            os: navigator.platform,
            location: locationData || undefined,
          },
        });
        setResponseId(newResponseId);
        currentResponseId = newResponseId;
      } catch (error) {
        console.error("Failed to create response:", error);
        toast.error("Failed to start response. Please try again.");
        setIsProcessing(false);
        return;
      }
    }

    if (!currentResponseId) {
      console.error("No response ID available");
      setIsProcessing(false);
      return;
    }

    // Save answer to DB
    await saveAnswer({
      responseId: currentResponseId,
      questionId: currentQuestion._id,
      value: answer,
      fileUrl:
        typeof answer === "object" && "storageId" in answer
          ? answer.storageId
          : undefined,
      fileName:
        typeof answer === "object" && "fileName" in answer
          ? answer.fileName
          : undefined,
      fileSize:
        typeof answer === "object" && "fileSize" in answer
          ? answer.fileSize
          : undefined,
    });

    // Save conversation
    await saveConversation({
      responseId: currentResponseId,
      messages: newMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        questionId: m.questionId,
        isAdaptive: m.isAdaptive,
        value: m.value,
      })),
    });

    if (
      currentQuestion.text.toLowerCase().includes("name") &&
      !currentQuestion.text.toLowerCase().includes("company") &&
      typeof answer === "string"
    ) {
      setUserName(answer);
    }

    // Determine next step
    const allAnswers = getAllAnswers(newMessages);
    let nextIndex = currentQuestionIndex + 1;

    while (
      nextIndex < questions!.length &&
      !shouldShowQuestion(questions![nextIndex], allAnswers)
    ) {
      nextIndex++;
    }

    if (nextIndex < questions!.length) {
      setCurrentQuestionIndex(nextIndex);

      // Delay asking the next question slightly to allow state updates to settle
      // and to give a natural pause
      if (!voiceEnabled) {
        askQuestion(nextIndex, userMessage.content);
      } else {
        setTimeout(() => {
          askQuestion(nextIndex, userMessage.content);
        }, 500);
      }
    } else {
      setIsReviewing(true);
    }
  };

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  const handleBack = () => {
    // Find the previous question in the history
    const assistantQuestions = messages.filter(
      (m) => m.role === "assistant" && m.questionId,
    );

    // We need at least 2 questions to go back (current + previous)
    if (assistantQuestions.length < 2) return;

    const previousQuestionMessage =
      assistantQuestions[assistantQuestions.length - 2];
    const targetIndex = messages.findIndex(
      (m) => m.id === previousQuestionMessage.id,
    );

    if (targetIndex === -1) return;

    // Rewind messages to include the previous question, but discard everything after it
    const newMessages = messages.slice(0, targetIndex + 1);
    setMessages(newMessages);
    messagesRef.current = newMessages;

    // Update current question index
    const previousQuestionIndex = questions!.findIndex(
      (q: any) => q._id === previousQuestionMessage.questionId,
    );

    if (previousQuestionIndex !== -1) {
      setCurrentQuestionIndex(previousQuestionIndex);
      // We don't need to call askQuestion because the message is already there
      // But we might want to re-focus or reset state
      setIsTyping(false);
      setIsProcessing(false);

      // Optionally speak the question again if voice is enabled
      // speakText(previousQuestionMessage.content);
    }
  };

  const handleBackToEdit = () => {
    // 1. Find the last user message (the answer to the current question)
    const lastUserMessageIndex = messages.findLastIndex(
      (m) => m.role === "user",
    );

    if (lastUserMessageIndex !== -1) {
      const lastMessage = messages[lastUserMessageIndex];

      // 2. Restore input value if it was text
      if (
        typeof lastMessage.content === "string" &&
        !lastMessage.content.startsWith("Uploaded") &&
        !lastMessage.content.startsWith("Selected")
      ) {
        setInputValue(lastMessage.content);
      }

      // 3. Remove the last message (and any subsequent assistant messages if any, though there shouldn't be)
      const newMessages = messages.slice(0, lastUserMessageIndex);
      setMessages(newMessages);
      messagesRef.current = newMessages;

      // 4. Reset currentQuestionIndex to the question we are re-answering
      const questionId = lastMessage.questionId;
      const questionIndex = questions?.findIndex(
        (q: any) => q._id === questionId,
      );
      if (questionIndex !== undefined && questionIndex !== -1) {
        setCurrentQuestionIndex(questionIndex);
      }
    }

    // 5. Exit review mode
    setIsReviewing(false);
    setIsProcessing(false);
    setIsTyping(false);
  };

  const canGoBack =
    messages.filter((m) => m.role === "assistant" && m.questionId).length > 1;

  const completeForm = async (idOverride?: Id<"responses">) => {
    const finalResponseId = idOverride || responseId;
    if (!finalResponseId) return;

    setIsTyping(true);
    setSubmitting(true);

    try {
      await saveConversation({
        responseId: finalResponseId,
        messages: messagesRef.current,
      });
      await updateResponse({
        responseId: finalResponseId,
        status: "completed",
      });
      setIsCompleted(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(`candid-form-${formId}`);
      }
    } catch (error) {
      console.error("Error completing form:", error);
      setIsTyping(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Update the speakText function
  const speakText = async (text: string) => {
    if (!voiceEnabled) return;

    // Stop any pending speech
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    // If we are recording, stop recognition and remember to restart later
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

    // Clear any pending auto-submit while speaking
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
              model_id: "eleven_turbo_v2", // Updated: eleven_monolingual_v1 deprecated on free tier
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
            "Submission received. Thank you for your detailed responses.",
          friendly: "All done! You're a star. Thanks for your time!",
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

        setMessages((prev) => {
          const newMessages = [...prev, completionMessage];
          messagesRef.current = newMessages;
          return newMessages;
        });
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
      // if speaking, do nothing (or you could queue start)
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

  if (!form)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  if (formData?.isOverResponseLimit)
    return <OverLimitScreen primaryColor={primaryColor} form={form} />;

  if (!started) return <WelcomeScreen form={form} onStart={handleStart} />;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor, fontFamily: font }}
    >
      <SaveResumeModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveProgress}
      />
      {isOffline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium">
          You are currently offline. Your progress is saved locally and will
          sync when you reconnect.
        </div>
      )}
      <FormHeader
        form={form}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions?.length || 0}
        progress={progress}
        isCompleted={isCompleted}
        voiceEnabled={voiceEnabled}
        onToggleVoice={toggleVoice}
        allowSaveAndResume={form?.settings.allowSaveAndResume}
        onSave={() => setIsSaveModalOpen(true)}
      />

      <div className="flex-1 overflow-y-auto mt-20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {isReviewing && !isCompleted ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Review Your Answers</h2>
                <p className="text-muted-foreground">
                  Please review your answers before submitting.
                </p>
              </div>

              <div className="space-y-4">
                {questions?.map((question: any) => {
                  const answer = getAllAnswers()[question._id];
                  return (
                    <div
                      key={question._id}
                      className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                      <p className="font-medium mb-2">{question.text}</p>
                      <div className="text-sm text-muted-foreground">
                        {answer ? (
                          typeof answer === "object" && "fileName" in answer ? (
                            <div className="flex items-center gap-2">
                              <span>📎 {answer.fileName}</span>
                            </div>
                          ) : typeof answer === "object" && "text" in answer ? (
                            answer.text
                          ) : (
                            String(answer)
                          )
                        ) : (
                          <span className="italic">Skipped</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBackToEdit}
                  className="flex-1 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={() => completeForm()}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Submit Form{" "}
                  {submitting && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <ChatMessages
                messages={messages}
                form={form}
                isTyping={isTyping}
              />
              {isCompleted && (
                <CompletionScreen secondaryColor={secondaryColor} />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {!isCompleted &&
        !isReviewing &&
        currentQuestion &&
        !isTyping &&
        !isProcessing && (
          <div
            className="border-t backdrop-blur-sm sticky bottom-0 transition-colors duration-300"
            style={{
              backgroundColor: backgroundColor
                ? `${backgroundColor}CC`
                : "rgba(255,255,255,0.8)", // Fallback to hex+alpha if possible, or just rely on valid hex
              borderTopColor: "rgba(0,0,0,0.05)",
            }}
          >
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
                    <Label htmlFor="auto-submit-switch">
                      Auto-submit answer
                    </Label>
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
                  pendingFile={pendingFile}
                  onRemoveFile={handleRemoveFile}
                  onSubmitFile={handleSubmitFile}
                  onBack={handleBack}
                  canGoBack={canGoBack}
                />
              )}

              {isProcessing && (
                <div className="flex items-center justify-center h-full gap-2 text-sm text-gray-500 font-medium py-2">
                  <span>Processing</span>
                  <div className="typing-pulse opacity-75 mt-1">
                    <div
                      className="dot"
                      style={{
                        backgroundColor: primaryColor,
                        width: "4px",
                        height: "4px",
                      }}
                    />
                    <div
                      className="dot"
                      style={{
                        backgroundColor: primaryColor,
                        width: "4px",
                        height: "4px",
                      }}
                    />
                    <div
                      className="dot"
                      style={{
                        backgroundColor: primaryColor,
                        width: "4px",
                        height: "4px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {isProcessing && (
        <div className="flex items-center justify-center h-full mb-12 gap-2 text-sm text-gray-500 font-medium py-2">
          <span>Processing</span>
          <div className="typing-pulse opacity-75 mt-1">
            <div
              className="dot"
              style={{
                backgroundColor: primaryColor,
                width: "4px",
                height: "4px",
              }}
            />
            <div
              className="dot"
              style={{
                backgroundColor: primaryColor,
                width: "4px",
                height: "4px",
              }}
            />
            <div
              className="dot"
              style={{
                backgroundColor: primaryColor,
                width: "4px",
                height: "4px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
