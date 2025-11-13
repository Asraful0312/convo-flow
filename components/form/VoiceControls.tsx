import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceControlsProps {
  isRecording: boolean;
  audioLevel: number;
  primaryColor: string;
  onToggle: () => void;
  disabled?: boolean;
}

export default function VoiceControls({
  isRecording,
  audioLevel,
  primaryColor,
  onToggle,
  disabled,
}: VoiceControlsProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className={`h-10 w-10 p-0 rounded-full transition-all ${isRecording ? "text-white" : "hover:bg-gray-100 hover:text-black"}`}
      style={isRecording ? { backgroundColor: primaryColor } : {}}
    >
      {isRecording ? (
        <div className="relative">
          <MicOff className="w-4 h-4" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white"
            animate={{ scale: [1, 1 + audioLevel * 0.5], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
