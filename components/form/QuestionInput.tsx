// components/QuestionInput.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, MapPin, Send, Star, Upload } from "lucide-react";
import VoiceControls from "./VoiceControls";
import { useRef } from "react";
import { Question } from "@/lib/form-types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


interface QuestionInputProps {
  question: Question;
  inputValue: string;
  isTyping: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (answer: any) => void;
  isProcessing: boolean;
  isUploading: boolean;
  multipleChoiceAnswers: string[];
  onMultipleChoiceChange: (option: string, checked: boolean) => void;
  primaryColor: string;
  voiceEnabled: boolean;
  isRecording: boolean;
  audioLevel: number;
  onToggleRecording: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function QuestionInput({
  question,
  inputValue,
  onInputChange,
  onSubmit,
  isProcessing,
  isUploading,
  isTyping,
  multipleChoiceAnswers,
  onMultipleChoiceChange,
  primaryColor,
  voiceEnabled,
  isRecording,
  audioLevel,
  onToggleRecording,
  onFileChange,
  onKeyPress,
}: QuestionInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  console.log("questions", question)

  const getQuestionInputType = (type: string) => {
    switch (type) {
      case "email": return "email";
      case "number": return "number";
      case "phone": return "tel";
      case "url": return "url";
      case "time": return "time";
      default: return "text";
    }
  };

  const handleSubmit = (answer: any) => {
    if (!isProcessing) {
      onSubmit(answer);
    }
  };

  return (
    <>
      {question.type === "choice" && question.options ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Select an option:</p>
          <RadioGroup
            onValueChange={(value) => handleSubmit(value)}
            disabled={isProcessing || isTyping}
            className="grid sm:grid-cols-2 gap-3"
          >
            {question.options.map((option, index) => (
              <div key={index}>
                <RadioGroupItem value={option} id={`option-${index}`} className="peer sr-only" />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-4 hover:bg-gray-50 cursor-pointer peer-data-[state=checked]:bg-opacity-10 transition-all"
                  style={{
                    borderColor: `var(--checked-border, #e5e7eb)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--checked-border", primaryColor);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--checked-border", "#e5e7eb");
                  }}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : question.type === "dropdown" && question.options ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Select an option:</p>
          <Select onValueChange={(value) => handleSubmit(value)} disabled={isProcessing || isTyping}>
            <SelectTrigger className="h-14 bg-white rounded-xl">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : question.type === "multiple_choice" && question.options ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-4"
              >
                <Checkbox
                  id={`mc-${index}`}
                  checked={multipleChoiceAnswers.includes(option)}
                  onCheckedChange={(checked) =>
                    onMultipleChoiceChange(option, Boolean(checked))
                  }
                />
                <Label htmlFor={`mc-${index}`} className="cursor-pointer flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          <Button
            onClick={() => handleSubmit(multipleChoiceAnswers)}
            disabled={multipleChoiceAnswers.length === 0 || isProcessing || isTyping}
            className="h-14 w-full text-white rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      ) : question.type === "rating" ? (
       <div className="space-y-3">
    <p className="text-sm text-gray-600 mb-3">{question.text}</p>
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 5 }).map((_, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => handleSubmit((index + 1).toString())}
          disabled={isProcessing || isTyping}
          className="h-12 w-12 p-0 flex items-center justify-center border-2 hover:border-yellow-400"
        >
          <Star
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
          />
        </Button>
      ))}
    </div>
  </div>
      ) : ["scale", "likert"].includes(question.type) && question.options ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">{question.text}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {question.options.map((option: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSubmit(option)}
                disabled={isProcessing || isTyping}
                className="h-12 px-6 border-2 hover:border-gray-400"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      ) : question.type === "file" ? (
        <div className="space-y-3 bg-white">
                    <p className="text-sm text-gray-600 mb-3">Upload a file:</p>
                    <div className="mt-4 flex justify-center space-x-4 rounded-md border border-dashed border-input px-6 py-10 bg-gray-100">
          <div className="sm:flex sm:items-center sm:gap-x-3">
            <Upload
              className="mx-auto h-8 w-8 text-muted-foreground sm:mx-0 sm:h-6 sm:w-6"
              aria-hidden={true}
            />
            <div className="mt-4 flex text-sm leading-6 text-foreground sm:mt-0">

              <Label
                htmlFor="file-upload-4"
                
                className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
              >
                <span> Drag and drop or choose file to upload </span>
                <input
                  id="file-upload-4"
                  name="file-upload-4"
                  type="file"
                  className="sr-only"
                  onChange={onFileChange}
                  disabled={isUploading || isProcessing || isTyping}
                />
              </Label>
            </div>
          </div>
        </div>
         
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      ) : question.type === "yes_no" ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">{question.text}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => handleSubmit("Yes")}
              disabled={isProcessing || isTyping}
              className="h-14 px-8 border-2 hover:border-gray-400"
            >
              Yes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("No")}
              disabled={isProcessing || isTyping}
              className="h-14 px-8 border-2 hover:border-gray-400"
            >
              No
            </Button>
          </div>
        </div>
      ) : question.type === "location" ? (
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef as any}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={question.placeholder || "Type a full address and press Send"}
              className="h-14 pl-10 pr-24 bg-white rounded-xl"
              onKeyDown={onKeyPress}
              disabled={isProcessing || isTyping}
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            {voiceEnabled && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceControls
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  primaryColor={primaryColor}
                  onToggle={onToggleRecording}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => handleSubmit(inputValue.trim())}
            disabled={!inputValue.trim() || isProcessing}
            className="h-14 px-6 text-white rounded-xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
       ) : question.type === "date" ? (
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-14 w-full justify-start text-left font-normal bg-white rounded-xl",
                    !inputValue && "text-muted-foreground"
                  )}
                  disabled={isProcessing || isTyping}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inputValue ? format(new Date(inputValue), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={inputValue ? new Date(inputValue) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      onInputChange(format(date, "yyyy-MM-dd"));
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {voiceEnabled && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceControls
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  primaryColor={primaryColor}
                  onToggle={onToggleRecording}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => handleSubmit(inputValue.trim())}
            disabled={!inputValue.trim() || isProcessing}
            className="h-14 px-6 text-white rounded-xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1 relative">
            {question.type === "textarea" ? (
              <Textarea
                ref={inputRef as any}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={question.placeholder || "Type your answer..."}
                className="min-h-[100px] pr-24 resize-none bg-white rounded-xl"
                onKeyDown={onKeyPress}
                disabled={isProcessing || isTyping}
              />
            ) : (
              <Input
                ref={inputRef as any}
                type={getQuestionInputType(question.type)}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={question.placeholder || "Type your answer..."}
                className="h-14 pr-24 bg-white rounded-xl"
                onKeyDown={onKeyPress}
                disabled={isProcessing || isTyping}
              />
            )}

            {voiceEnabled && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceControls
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  primaryColor={primaryColor}
                  onToggle={onToggleRecording}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          <Button
            onClick={() => handleSubmit(inputValue.trim())}
            disabled={!inputValue.trim() || isProcessing}
            className="h-14 px-6 text-white rounded-xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}

      {!question.required && question.type !== "file" && question.type !== "choice" && question.type !== "dropdown" && question.type !== "multiple_choice" && question.type !== "rating" && !["scale", "likert"].includes(question.type) && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSubmit("")}
            disabled={isProcessing}
            className=""
          >
            Skip this question
          </Button>
        </div>
      )}
    </>
  );
}


