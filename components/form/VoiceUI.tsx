"use client";

import { cn } from "@/lib/utils";
import { Bot, Check, Send, Volume2 } from "lucide-react";
import styled from "styled-components";
import { Button } from "../ui/button";
import TypingIndicator from "./TypingIndicator";

interface VoiceUIProps {
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isTyping: boolean;
  transcript: string;
  onToggleRecording: () => void;
  onSubmit: () => void;
  question: string;
  audioLevel: number;
  primaryColor: string;
}

export default function VoiceUI({
  isRecording,
  isSpeaking,
  isProcessing,
  isTyping,
  transcript,
  onToggleRecording,
  onSubmit,
  question,
  audioLevel,
  primaryColor,
}: VoiceUIProps) {
  const getStatus = () => {
    if (isProcessing)
      return {
        icon: <Check className="w-5 h-5" />,
        text: "Got it!",
      };
    if (isSpeaking)
      return {
        icon: <Bot className="w-5 h-5" />,
        text: "Speaking...",
      };
    if (isRecording)
      return {
        icon: <Volume2 className="w-5 h-5" />,
        text: "I'm listening...",
      };
    if (isTyping)
      return {
        icon: null,
        text: <TypingIndicator primaryColor={primaryColor} />,
      };
    return { icon: null, text: "Tap to speak" };
  };

  const { icon, text } = getStatus();

  return (
    <div className="flex flex-col items-center justify-between h-full text-center w-full">
      <div className="w-full">
        <p className="text-xl font-semibold text-gray-800 mb-4 px-4">
          {question}
        </p>
        <div
          className="w-full bg-gray-100 rounded-lg p-4 min-h-[100px] text-left"
          style={{
            border: isRecording
              ? `2px solid ${primaryColor}`
              : "2px solid transparent",
            transition: "border 0.2s ease-in-out",
          }}
        >
          <p className="text-gray-600">{transcript || "..."}</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center w-28 h-28 my-6">
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-transform duration-200",
            )}
            style={{
              backgroundColor: `${primaryColor}33`,
              transform: `scale(${isRecording ? 1 + audioLevel * 1.5 : 0})`,
            }}
          />
          <button
            onClick={onToggleRecording}
            disabled={isSpeaking || isProcessing || isTyping}
          >
            <StyledWrapper>
              <div className="loader">
                <svg width={100} height={100} viewBox="0 0 100 100">
                  <defs>
                    <mask id={isSpeaking ? "clipping" : "none"}>
                      <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                      <polygon points="25,25 75,25 50,75" fill="white" />
                      <polygon points="50,25 75,75 25,75" fill="white" />
                      <polygon points="35,35 65,35 50,65" fill="white" />
                      <polygon points="35,35 65,35 50,65" fill="white" />
                      <polygon points="35,35 65,35 50,65" fill="white" />
                      <polygon points="35,35 65,35 50,65" fill="white" />
                    </mask>
                  </defs>
                </svg>
                <div className="box" />
              </div>
            </StyledWrapper>
          </button>
          {/* <Button
            size="icon"
            className="w-24 h-24 rounded-full"
            onClick={onToggleRecording}
            disabled={isSpeaking || isProcessing || isTyping}
            style={{ backgroundColor: primaryColor }}
          >
            <Mic className="w-10 h-10" />
          </Button> */}
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground h-5">
          {icon}
          <span>{text}</span>
        </div>
      </div>

      <div className="w-full flex justify-center mt-6">
        <Button
          variant="outline"
          onClick={onSubmit}
          disabled={
            isSpeaking || isProcessing || isTyping || !transcript.trim()
          }
        >
          <Send className="mr-2 h-4 w-4" /> Submit Manually
        </Button>
      </div>
    </div>
  );
}

const StyledWrapper = styled.div`
  .loader {
    --color-one: #ffbf48;
    --color-two: #be4a1d;
    --color-three: #ffbf4780;
    --color-four: #bf4a1d80;
    --color-five: #ffbf4740;
    --time-animation: 2s;
    --size: 1; /* You can change the size */
    position: relative;
    border-radius: 50%;
    transform: scale(var(--size));
    box-shadow:
      0 0 25px 0 var(--color-three),
      0 20px 50px 0 var(--color-four);
    animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
  }

  .loader::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border-top: solid 1px var(--color-one);
    border-bottom: solid 1px var(--color-two);
    background: linear-gradient(180deg, var(--color-five), var(--color-four));
    box-shadow:
      inset 0 10px 10px 0 var(--color-three),
      inset 0 -10px 10px 0 var(--color-four);
  }

  .loader .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(
      180deg,
      var(--color-one) 30%,
      var(--color-two) 70%
    );
    mask: url(#clipping);
    -webkit-mask: url(#clipping);
  }

  .loader svg {
    position: absolute;
  }

  .loader svg #clipping {
    filter: contrast(15);
    animation: roundness calc(var(--time-animation) / 2) linear infinite;
  }

  .loader svg #clipping polygon {
    filter: blur(7px);
  }

  .loader svg #clipping polygon:nth-child(1) {
    transform-origin: 75% 25%;
    transform: rotate(90deg);
  }

  .loader svg #clipping polygon:nth-child(2) {
    transform-origin: 50% 50%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(3) {
    transform-origin: 50% 60%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -3);
  }

  .loader svg #clipping polygon:nth-child(4) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
  }

  .loader svg #clipping polygon:nth-child(5) {
    transform-origin: 40% 40%;
    animation: rotation var(--time-animation) linear infinite reverse;
    animation-delay: calc(var(--time-animation) / -2);
  }

  .loader svg #clipping polygon:nth-child(6) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
  }

  .loader svg #clipping polygon:nth-child(7) {
    transform-origin: 60% 40%;
    animation: rotation var(--time-animation) linear infinite;
    animation-delay: calc(var(--time-animation) / -1.5);
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes roundness {
    0% {
      filter: contrast(15);
    }
    20% {
      filter: contrast(3);
    }
    40% {
      filter: contrast(3);
    }
    60% {
      filter: contrast(15);
    }
    100% {
      filter: contrast(15);
    }
  }

  @keyframes colorize {
    0% {
      filter: hue-rotate(0deg);
    }
    20% {
      filter: hue-rotate(-30deg);
    }
    40% {
      filter: hue-rotate(-60deg);
    }
    60% {
      filter: hue-rotate(-90deg);
    }
    80% {
      filter: hue-rotate(-45deg);
    }
    100% {
      filter: hue-rotate(0deg);
    }
  }
`;
