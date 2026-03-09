"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageChoiceOption, Question } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  MapPin,
  Send,
  Star,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import ImageChoiceInput from "./ImageChoiceInput";
import VoiceControls from "./VoiceControls";

interface QuestionInputProps {
  question: Question;
  inputValue: string;
  isTyping: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (answer: any) => void;
  isProcessing: boolean;
  isUploading: boolean;
  multipleChoiceAnswers: string[];
  onMultipleChoiceChange: (checked: boolean, option: string) => void;
  primaryColor: string;
  voiceEnabled: boolean;
  isRecording: boolean;
  audioLevel: number;
  onToggleRecording: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  pendingFile?: { fileName: string; fileSize: number } | null;
  onRemoveFile?: () => void;
  onSubmitFile?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
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
  pendingFile,
  onRemoveFile,
  onSubmitFile,
  onBack,
  canGoBack,
}: QuestionInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const errorId = `error-${question._id}`;

  const getQuestionInputType = (type: string) => {
    switch (type) {
      case "email":
        return "email";
      case "number":
        return "number";
      case "phone":
        return "tel";
      case "url":
        return "url";
      case "time":
        return "time";
      default:
        return "text";
    }
  };

  const validateInput = (value: any): string | null => {
    // If empty and not required, it's valid (unless specific type logic says otherwise)
    if (!value && !question.required) return null;

    // If empty and required
    if (!value && question.required) return "This field is required";

    if (question.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address";
    }

    if (question.type === "url") {
      try {
        new URL(value);
      } catch {
        return "Please enter a valid URL (e.g., https://example.com)";
      }
    }

    if (question.type === "number") {
      const num = Number(value);
      if (isNaN(num)) return "Please enter a valid number";
      if (
        question.validation?.min !== undefined &&
        num < question.validation.min
      ) {
        return `Value must be at least ${question.validation.min}`;
      }
      if (
        question.validation?.max !== undefined &&
        num > question.validation.max
      ) {
        return `Value must be at most ${question.validation.max}`;
      }
    }

    if (question.type === "phone") {
      // Basic phone validation (allow +, -, space, (), digits)
      const phoneRegex = /^[\d\+\-\(\)\s]{7,}$/;
      if (!phoneRegex.test(value)) return "Please enter a valid phone number";
    }

    if (question.validation?.pattern) {
      try {
        const regex = new RegExp(question.validation.pattern);
        if (!regex.test(value))
          return question.validation.errorMessage || "Invalid format";
      } catch (e) {
        console.error(e);
        // Ignore invalid regex in schema
      }
    }

    return null;
  };

  const handleSubmit = (answer: any) => {
    if (isProcessing) return;

    setError(null);
    const validationError = validateInput(answer);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(answer);
  };

  return (
    <>
      {canGoBack && onBack && (
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isProcessing || isTyping}
            className="text-muted-foreground -ml-2 hover:text-white"
            aria-label="Go back to previous question"
          >
            ← Back
          </Button>
        </div>
      )}

      {question.type === "choice" && question.options ? (
        <div className="space-y-3" role="radiogroup" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            Select an option:
          </p>
          <RadioGroup
            onValueChange={(value) => handleSubmit(value)}
            disabled={isProcessing || isTyping}
            className="grid sm:grid-cols-2 gap-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                style={{
                  "--primary-color": primaryColor,
                  "--primary-color-10": `${primaryColor}1A`,
                }}
              >
                <RadioGroupItem
                  value={option as string}
                  id={`option-${index}`}
                  className="peer sr-only"
                  aria-label={option as string}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className={cn(
                    "flex items-center justify-center rounded-xl border-2 px-6 py-4 cursor-pointer transition-all",
                    "peer-data-[state=checked]:bg-opacity-10 peer-data-[state=checked]:border-(--primary-color)",
                  )}
                  style={{
                    borderColor: "var(--primary-color)",
                    backgroundColor: "var(--primary-color)",
                  }}
                >
                  {option as string}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : question.type === "image_choice" && question.options ? (
        <div className="space-y-3" role="radiogroup" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            Choose an option:
          </p>
          <ImageChoiceInput
            disabled={isProcessing || isTyping}
            options={question.options as ImageChoiceOption[]}
            selectedOption={null} // This component is for immediate submission
            onSelect={(option) => handleSubmit(option)}
            primaryColor={primaryColor}
          />
        </div>
      ) : question.type === "dropdown" && question.options ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            Select an option:
          </p>
          <Select
            onValueChange={(value) => handleSubmit(value)}
            disabled={isProcessing || isTyping}
          >
            <SelectTrigger
              className="h-14 bg-white rounded-xl w-full"
              aria-label={question.text}
            >
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option, index) => (
                <SelectItem key={index} value={option as string}>
                  {option as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : question.type === "multiple_choice" && question.options ? (
        <div className="space-y-4" role="group" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            Select all that apply:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-4"
              >
                <Checkbox
                  id={`mc-${index}`}
                  checked={multipleChoiceAnswers.includes(option as string)}
                  onCheckedChange={(checked) => {
                    console.log("checked", checked, option);
                    onMultipleChoiceChange(!!checked, option as string);
                  }}
                  aria-label={option as string}
                />

                <Label
                  htmlFor={`mc-${index}`}
                  className="cursor-pointer flex-1"
                >
                  {option as string}
                </Label>
              </div>
            ))}
          </div>

          <Button
            onClick={() => handleSubmit(multipleChoiceAnswers.join(", "))}
            disabled={
              multipleChoiceAnswers.length === 0 || isProcessing || isTyping
            }
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
        <div className="space-y-3" role="group" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            {question.text}
          </p>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 5 }).map((_, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSubmit((index + 1).toString())}
                disabled={isProcessing || isTyping}
                className="h-12 w-12 p-0 flex items-center justify-center border-2 hover:border-yellow-400"
                aria-label={`Rate ${index + 1} out of 5 stars`}
              >
                <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              </Button>
            ))}
          </div>
        </div>
      ) : question.type === "scale" ? (
        <div className="space-y-4" role="group" aria-label={question.text}>
          <p
            className="text-sm text-muted-foreground mb-3 font-medium"
            aria-hidden="true"
          >
            {question.text}
          </p>
          <div className="space-y-3">
            {(() => {
              const min = question.validation?.min || 1;
              const max = question.validation?.max || 10;
              const range = max - min + 1;

              if (range <= 10) {
                return (
                  <>
                    <div
                      className="flex justify-between text-xs text-muted-foreground px-2 font-medium"
                      aria-hidden="true"
                    >
                      <span>{min} (Lowest)</span>
                      <span>{max} (Highest)</span>
                    </div>
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
                      <RadioGroup
                        onValueChange={(value) => handleSubmit(value)}
                        disabled={isProcessing || isTyping}
                        className="flex gap-2 sm:justify-between min-w-max sm:min-w-0"
                      >
                        {Array.from({ length: range }).map((_, i) => {
                          const v = min + i;
                          return (
                            <div
                              key={v}
                              className="flex flex-col items-center gap-1"
                            >
                              <RadioGroupItem
                                value={v.toString()}
                                id={`scale-${question._id}-${v}`}
                                className="peer sr-only"
                                aria-label={v.toString()}
                              />
                              <Label
                                htmlFor={`scale-${question._id}-${v}`}
                                className={cn(
                                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all border-2 border-transparent font-medium text-sm sm:text-base",
                                  "bg-muted hover:bg-muted/80 text-muted-foreground",
                                  "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md peer-data-[state=checked]:scale-110",
                                )}
                                style={
                                  {
                                    "--primary": primaryColor,
                                  } as React.CSSProperties
                                }
                              >
                                {v}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="px-2">
                    <div
                      className="flex justify-between text-xs text-muted-foreground mb-2 font-medium"
                      aria-hidden="true"
                    >
                      <span>{min}</span>
                      <span>{max}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={inputValue || min}
                        onChange={(e) => onInputChange(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-(--primary)"
                        style={
                          {
                            "--primary": primaryColor,
                          } as React.CSSProperties
                        }
                        disabled={isProcessing || isTyping}
                        aria-label={question.text}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={Number(inputValue || min)}
                      />
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                        style={{ backgroundColor: primaryColor }}
                        aria-hidden="true"
                      >
                        {inputValue || min}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() =>
                          handleSubmit(inputValue || min.toString())
                        }
                        disabled={isProcessing || isTyping}
                        className="text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Confirm {inputValue || min}
                      </Button>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      ) : question.type === "likert" && question.options ? (
        <div className="space-y-3" role="group" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            {question.text}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {question.options.map((option: any, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleSubmit(option)}
                disabled={isProcessing || isTyping}
                className="h-12 px-6 border-2 hover:border-gray-400"
                aria-label={option}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      ) : question.type === "file" ? (
        <div className="space-y-3 bg-white">
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            Upload a file:
          </p>

          {pendingFile ? (
            <div className="mt-4 rounded-md border border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {pendingFile.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(pendingFile.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFile}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Remove ${pendingFile.fileName}`}
                >
                  Remove
                </Button>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={onSubmitFile}
                  disabled={isProcessing}
                  className="w-full sm:w-auto text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit File
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mt-4 flex justify-center space-x-4 rounded-md border border-dashed border-input px-6 py-10 bg-gray-100 hover:bg-gray-50 transition-colors">
                <input
                  id={`file-upload-${question._id || "default"}`}
                  name={`file-upload-${question._id || "default"}`}
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={onFileChange}
                  disabled={isUploading || isProcessing || isTyping}
                  aria-label="Upload a file"
                />
                <div className="sm:flex sm:items-center sm:gap-x-3 pointer-events-none">
                  <Upload
                    className="mx-auto h-8 w-8 text-muted-foreground sm:mx-0 sm:h-6 sm:w-6"
                    aria-hidden={true}
                  />
                  <div className="mt-4 flex text-sm leading-6 text-foreground sm:mt-0">
                    <span className="font-medium text-primary">
                      Drag and drop or choose file to upload
                    </span>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div
                  className="flex items-center gap-2 text-sm text-gray-500 mt-2"
                  role="status"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </>
          )}
        </div>
      ) : question.type === "yes_no" ? (
        <div className="space-y-3" role="group" aria-label={question.text}>
          <p className="text-sm text-gray-600 mb-3" aria-hidden="true">
            {question.text}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => handleSubmit("Yes")}
              disabled={isProcessing || isTyping}
              className="h-14 px-8 border-2 hover:border-border"
              aria-label="Yes"
            >
              Yes
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("No")}
              disabled={isProcessing || isTyping}
              className="h-14 px-8 border-2 hover:border-border"
              aria-label="No"
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
              placeholder={
                question.placeholder || "Type a full address and press Send"
              }
              className={cn("h-14 pl-10 pr-24 bg-white rounded-xl")}
              onKeyDown={onKeyPress}
              disabled={isProcessing || isTyping}
              aria-label={question.text}
              aria-invalid={!!error}
              aria-errormessage={error ? errorId : undefined}
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
            aria-label="Submit answer"
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
                    !inputValue && "text-muted-foreground",
                  )}
                  disabled={isProcessing || isTyping}
                  aria-label={question.text}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inputValue ? (
                    format(new Date(inputValue), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
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
            aria-label="Submit answer"
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
                aria-label={question.text}
                aria-invalid={!!error}
                aria-errormessage={error ? errorId : undefined}
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
                aria-label={question.text}
                aria-invalid={!!error}
                aria-errormessage={error ? errorId : undefined}
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
            aria-label="Submit answer"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-500 mt-2 animate-in fade-in slide-in-from-top-1"
        >
          {error}
        </p>
      )}

      {!question.required &&
        question.type !== "file" &&
        question.type !== "choice" &&
        question.type !== "dropdown" &&
        question.type !== "multiple_choice" &&
        question.type !== "rating" &&
        !["scale", "likert"].includes(question.type) && (
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSubmit("")}
              disabled={isProcessing || isTyping}
              className=""
            >
              Skip
            </Button>
          </div>
        )}
    </>
  );
}
