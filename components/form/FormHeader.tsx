"use client";
import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

interface FormHeaderProps {
  form: FormData;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isCompleted: boolean;
  allowSaveAndResume?: boolean;
  onSave?: () => void;
}

export default function FormHeader({
  form,
  totalQuestions,
  progress,
  voiceEnabled,
  onToggleVoice,
  isCompleted,
  allowSaveAndResume,
  onSave,
}: FormHeaderProps) {
  const backgroundColor = form.settings.branding?.backgroundColor || "#ffffff";
  const primaryColor = form.settings.branding?.primaryColor || "#F56A4D";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div
        className="absolute inset-0 backdrop-blur-md border-b border-border shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: backgroundColor
            ? `${backgroundColor}CC`
            : "rgba(255,255,255,0.8)",
        }}
      />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {form.settings.branding?.logoUrl ? (
            <Image
              src={form.settings.branding.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0"
              width={32}
              height={32}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground text-sm sm:text-base truncate leading-tight">
              {form.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {allowSaveAndResume && !isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              Save & resume
            </Button>
          )}

          {form.aiConfig?.enableVoice && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVoice}
              className={cn(
                "h-8 w-8 rounded-full transition-colors ",
                voiceEnabled
                  ? "bg-primary/10 hover:text-white group"
                  : "hover:bg-muted",
              )}
            >
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4 group-hover:text-white" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {!isCompleted && totalQuestions > 0 && (
            <div className="flex flex-col items-end gap-1 min-w-[60px] sm:min-w-[100px]">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {Math.round(progress)}% completed
              </span>
              {form.settings.showProgressBar !== false && (
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
