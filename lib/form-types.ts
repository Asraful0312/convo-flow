import { Id } from "@/convex/_generated/dataModel";

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: number;
  questionId?: string;
  isAdaptive?: boolean;
}

export interface FormData {
  _id: Id<"forms">;
  title: string;
  description?: string;
  questions: Question[];
  settings: {
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
    showProgressBar?: boolean;
  };
  aiConfig?: {
    personality?: string;
    enableVoice?: boolean;
    language?: string;
  };
  status: string;
  ownerName?: string;
}

export interface ImageChoiceOption {
  text: string;
  imageUrl: string;
}

export interface Question {
  _id: string;
  text: string;
  type: string;
  options?: (string | ImageChoiceOption)[];
  placeholder?: string;
  required?: boolean;
}