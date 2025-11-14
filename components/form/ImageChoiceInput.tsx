"use client";

import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export interface ImageChoiceOption {
  text: string;
  imageUrl: string;
}

interface ImageChoiceInputProps {
  options: ImageChoiceOption[];
  selectedOption: ImageChoiceOption | null;
  onSelect: (option: ImageChoiceOption) => void;
  primaryColor: string;
}

export default function ImageChoiceInput({
  options,
  selectedOption,
  onSelect,
  primaryColor,
}: ImageChoiceInputProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {options.map((option, index) => (
        <div
          key={index}
          onClick={() => onSelect(option)}
          className={cn(
            "relative rounded-xl border-2 p-2 cursor-pointer transition-all duration-200",
            selectedOption?.text === option.text
              ? "border-transparent ring-2"
              : "border-gray-200 hover:border-gray-400",
          )}
          style={{
            borderColor: primaryColor,
          }}
        >
          {selectedOption?.text === option.text && (
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
          <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden mb-2">
            <img
              src={option.imageUrl}
              alt={option.text}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-sm font-medium text-gray-700">
            {option.text}
          </p>
        </div>
      ))}
    </div>
  );
}
