import { Id } from "../convex/_generated/dataModel";

// Add this to your Message type definition in lib/form-types.ts
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  questionId?: string;
  isAdaptive?: boolean;
  value?: any; // ✅ Add this to store full objects for special types like image_choice
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
      backgroundColor?: string;
      font?: string;
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
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
}
