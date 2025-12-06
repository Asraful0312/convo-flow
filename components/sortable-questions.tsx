"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { ImageChoiceOption } from "@/lib/form-types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";

const QUESTION_TYPE_MAP: Record<string, string> = {
  "Short Text": "text",
  "Long Text": "textarea",
  Email: "email",
  Number: "number",
  Currency: "currency",
  Phone: "phone",
  URL: "url",
  Date: "date",
  "Date Range": "date_range",
  Time: "time",
  "Yes/No": "yes_no",
  Location: "location",
  "Single Choice": "choice",
  "Multiple Choice": "multiple_choice",
  "Image Choice": "image_choice",
  Dropdown: "dropdown",
  "Rating (1–5)": "rating",
  "Scale": "scale",
  "File Upload": "file",
};

export default function SortableQuestion({
  question,
  onUpdate,
  onDelete,
}: {
  question: any;
  onUpdate: (id: Id<"questions">, updates: any) => void;
  onDelete: (id: Id<"questions">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  console.log("question", question);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [localText, setLocalText] = useState(question.text);
  const [localTypeLabel, setLocalTypeLabel] = useState(
    Object.entries(QUESTION_TYPE_MAP).find(
      ([_, v]) => v === question.type,
    )?.[0] ?? "Short Text",
  );
  const [localOptions, setLocalOptions] = useState(question.options || []);

  useEffect(() => {
    setLocalText(question.text);
    setLocalOptions(question.options || []);
    const label =
      Object.entries(QUESTION_TYPE_MAP).find(
        ([_, v]) => v === question.type,
      )?.[0] ?? "Short Text";
    setLocalTypeLabel(label);
  }, [question]);

  const handleOptionsChange = (newOptions: any) => {
    setLocalOptions(newOptions);
    onUpdate(question._id, { options: newOptions });
  };

  const handleImageOptionChange = (
    index: number,
    field: "text" | "imageUrl",
    value: string,
  ) => {
    const newOptions = [...localOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    handleOptionsChange(newOptions);
  };

  const addImageOption = () => {
    const newOptions = [
      ...localOptions,
      { text: `Option ${localOptions.length + 1}`, imageUrl: "" },
    ];
    handleOptionsChange(newOptions);
  };

  const removeImageOption = (index: number) => {
    const newOptions = localOptions.filter((_: any, i: number) => i !== index);
    handleOptionsChange(newOptions);
  };

  return (
    <Card ref={setNodeRef} style={style} className="border-2">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-move"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 flex-wrap space-y-2">
                <Label>Question</Label>
                <Input
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  onBlur={(e) => {
                    const text = e.target.value;
                    if (text !== question.text) {
                      onUpdate(question._id, { text });
                    }
                  }}
                  placeholder="Enter your question"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onDelete(question._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 grid-cols-1">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={localTypeLabel}
                  onValueChange={(label) => {
                    const type = QUESTION_TYPE_MAP[label];
                    if (type !== question.type) {
                      onUpdate(question._id, { type });
                    }
                    setLocalTypeLabel(label);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(QUESTION_TYPE_MAP)
                      .sort()
                      .map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-start  gap-2 sm:pt-8">
                <Label htmlFor={`required-${question._id}`}>Required</Label>
                <Switch
                  id={`required-${question._id}`}
                  checked={question.required}
                  onCheckedChange={(checked) =>
                    onUpdate(question._id, { required: checked })
                  }
                />
              </div>
            </div>
            {question.type === "image_choice" && (
              <div className="space-y-3">
                <Label>Image Options</Label>
                {(localOptions as ImageChoiceOption[]).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Input
                      value={opt.text}
                      onChange={(e) =>
                        handleImageOptionChange(i, "text", e.target.value)
                      }
                      placeholder="Option text"
                      className="flex-1"
                    />
                    <Input
                      value={opt.imageUrl}
                      onChange={(e) =>
                        handleImageOptionChange(i, "imageUrl", e.target.value)
                      }
                      placeholder="Image URL"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImageOption(i)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addImageOption}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </Button>
              </div>
            )}
            {(question.type === "choice" ||
              question.type === "multiple_choice" ||
              question.type === "dropdown") && (
              <div className="space-y-2">
                <Label>Options (one per line)</Label>
                <Textarea
                  value={(localOptions as string[]).join("\n")}
                  onChange={(e) =>
                    setLocalOptions(e.target.value.split("\n"))
                  }
                  onBlur={() => onUpdate(question._id, { options: localOptions })}
                />
              </div>
            )}
            {question.type === "scale" && (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Value</Label>
                  <Input
                    type="number"
                    value={question.validation?.min ?? 1}
                    onChange={(e) =>
                      onUpdate(question._id, {
                        validation: {
                          ...question.validation,
                          min: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Value</Label>
                  <Input
                    type="number"
                    value={question.validation?.max ?? 10}
                    onChange={(e) =>
                      onUpdate(question._id, {
                        validation: {
                          ...question.validation,
                          max: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                  />
                </div>
              </div>
              
              {/* Visual Preview of the Scale */}
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-muted-foreground mb-3 block">Preview</Label>
                {(() => {
                  const min = question.validation?.min ?? 1;
                  const max = question.validation?.max ?? 10;
                  const range = max - min + 1;

                  if (range <= 10) {
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground px-2 font-medium">
                          <span>{min} (Lowest)</span>
                          <span>{max} (Highest)</span>
                        </div>
                        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                          <RadioGroup
                            disabled
                            className="flex gap-2 sm:justify-between min-w-max sm:min-w-0"
                          >
                            {Array.from({ length: range }).map((_, i) => {
                              const v = min + i;
                              return (
                                <div key={v} className="flex flex-col items-center gap-1">
                                  <RadioGroupItem
                                    value={v.toString()}
                                    id={`preview-${question._id}-${v}`}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={`preview-${question._id}-${v}`}
                                    className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center border-2 border-transparent font-medium text-sm",
                                      "bg-muted text-muted-foreground opacity-50"
                                    )}
                                  >
                                    {v}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="px-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
                          <span>{min}</span>
                          <span>{max}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={1}
                            disabled
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed"
                          />
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-md bg-muted text-muted-foreground">
                            {min}
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}