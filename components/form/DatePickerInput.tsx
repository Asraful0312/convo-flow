"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function DatePickerInput({
  onSubmit,
  isProcessing,
}: {
  onSubmit: (value: string) => void;
  isProcessing: boolean;
  primaryColor: string;
}) {
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);

  const handleSelect = (selected: Date | undefined) => {
    if (selected) {
      setDate(selected);
      onSubmit(selected.toISOString()); // send date as ISO string
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="justify-between font-normal w-full h-14 bg-white rounded-xl"
            disabled={isProcessing}
          >
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={date}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
