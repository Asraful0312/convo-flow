import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/form-types";
import { Sparkles, Volume2, VolumeX } from "lucide-react";

interface FormHeaderProps {
  form: FormData;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isCompleted: boolean;
}

export default function FormHeader({
  form,
  currentQuestionIndex,
  totalQuestions,
  progress,
  voiceEnabled,
  onToggleVoice,
  isCompleted,
}: FormHeaderProps) {
  const primaryColor = form.settings.branding?.primaryColor || "#F56A4D";
  const secondaryColor = form.settings.branding?.secondaryColor || "#2EB7A7";

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {form.settings.branding?.logoUrl ? (
            <img src={form.settings.branding.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
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
            <Button variant="ghost" size="sm" onClick={onToggleVoice} className="h-9 w-9 p-0">
              {voiceEnabled ? <Volume2 className="w-4 h-4" style={{ color: secondaryColor }} /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </Button>
          )}
          {!isCompleted && totalQuestions > 0 && (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">
                {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              {form.settings.showProgressBar !== false && (
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}