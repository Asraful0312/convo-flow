import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";

interface TypingIndicatorProps {
  primaryColor: string;
  logoUrl?: string;
}

export default function TypingIndicator({
  primaryColor,
  logoUrl,
}: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 justify-start"
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="Logo"
          className="w-8 h-8 rounded-lg"
          height={32}
          width={32}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="typing-pulse p-0">
          <div className="dot" style={{ backgroundColor: primaryColor }} />
          <div className="dot" style={{ backgroundColor: primaryColor }} />
          <div className="dot" style={{ backgroundColor: primaryColor }} />
        </div>
      </div>
    </motion.div>
  );
}
