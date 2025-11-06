import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface TypingIndicatorProps {
  primaryColor: string;
  logoUrl?: string;
}

export default function TypingIndicator({ primaryColor, logoUrl }: TypingIndicatorProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg" />
      ) : (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}