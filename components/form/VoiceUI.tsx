// components/form/VoiceUI.tsx
import React from 'react';
import { Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceUIProps {
  question: any;
  transcript: string;
  isRecording: boolean;
  isReplying: boolean;
  isCompleted: boolean;
  onToggleRecording: () => void;
  onSubmit: () => void;
  audioLevel: number;
}

const VoiceUI: React.FC<VoiceUIProps> = ({
  question,
  transcript,
  isRecording,
  isReplying,
  isCompleted,
  onToggleRecording,
  onSubmit,
  audioLevel,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl px-4 text-center">
        <div className="mb-8">
          <p className="text-2xl font-semibold text-foreground">{question?.text}</p>
        </div>

        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-primary/20 transition-transform duration-300 ease-in-out`}
            style={{ transform: `scale(${1 + audioLevel * 2})` }}
          />
          <Button
            size="icon"
            className={`relative w-32 h-32 rounded-full transition-colors ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'
            }`}
            onClick={onToggleRecording}
            disabled={isReplying || isCompleted}
          >
            <Mic className="w-16 h-16" />
          </Button>
        </div>

        <div className="mt-8 min-h-[60px] flex items-center justify-center">
          <p className="text-2xl font-medium text-foreground">
            {isRecording 
              ? "Listening..." 
              : isReplying 
                ? "Candid is replying..." 
                : (transcript || <span className="text-muted-foreground/50">Press the button and start speaking</span>)
            }
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={onSubmit} disabled={!transcript || isRecording || isReplying || isCompleted} size="lg">
            <Send className="w-5 h-5 mr-2" />
            Submit Answer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceUI;
