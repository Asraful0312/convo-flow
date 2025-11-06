import { FormData, Message } from "@/lib/form-types";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import TypingIndicator from "./TypingIndicator";

interface ChatMessagesProps {
  messages: Message[];
  form: FormData;
  isTyping: boolean;
}

export default function ChatMessages({ messages, form, isTyping }: ChatMessagesProps) {
  const primaryColor = form.settings.branding?.primaryColor || "#F56A4D";
  const secondaryColor = form.settings.branding?.secondaryColor || "#2EB7A7";

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <>
                {form.settings.branding?.logoUrl ? (
                  <img src={form.settings.branding.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
              </>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-6 py-4 ${
                message.role === "user" ? "text-white" : "bg-white border border-gray-200 shadow-sm"
              }`}
              style={
                message.role === "user"
                  ? { backgroundColor: primaryColor }
                  : message.isAdaptive
                  ? { borderColor: secondaryColor, borderWidth: 2 }
                  : {}
              }
            >
              <p className="leading-relaxed">{message.content}</p>
            </div>
            {message.role === "user" && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-medium" style={{ backgroundColor: secondaryColor }}>
                U
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isTyping && <TypingIndicator primaryColor={primaryColor} logoUrl={form.settings.branding?.logoUrl} />}
    </div>
  );
}