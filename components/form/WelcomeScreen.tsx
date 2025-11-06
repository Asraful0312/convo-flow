// components/WelcomeScreen.tsx
import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/form-types";
import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  form: FormData;
  onStart: () => void;
}

export default function WelcomeScreen({ form, onStart }: WelcomeScreenProps) {
  const primaryColor = form.settings.branding?.primaryColor || "#F56A4D";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
      <div className="flex items-center gap-3 mb-4">
        {form.settings.branding?.logoUrl ? (
          <img src={form.settings.branding.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        )}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
      {form.description && <p className="text-lg text-gray-600 max-w-2xl mb-6">{form.description}</p>}
      <Button onClick={onStart} className="h-12 px-8 text-lg text-white rounded-xl" style={{ backgroundColor: primaryColor }}>
        Start Conversation
      </Button>
    </div>
  );
}