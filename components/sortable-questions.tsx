"use client"

import { Id } from "@/convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { GripVertical, Trash2 } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

const QUESTION_TYPE_MAP: Record<string, string> = {
  "Short Text": "text",
  "Long Text": "textarea",
  Email: "email",
  Number: "number",
  "Multiple Choice": "choice",
  Checkboxes: "checkbox",
  Rating: "rating",
  Date: "date",
  Phone: "phone",
  File: "file",
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Local state for controlled inputs
  const [localText, setLocalText] = useState(question.text);
  const [localTypeLabel, setLocalTypeLabel] = useState(
    Object.entries(QUESTION_TYPE_MAP).find(([_, v]) => v === question.type)?.[0] ?? "Short Text"
  );

  useEffect(() => {
    setLocalText(question.text);
  }, [question.text]);

  useEffect(() => {
    const label = Object.entries(QUESTION_TYPE_MAP).find(([_, v]) => v === question.type)?.[0] ?? "Short Text";
    setLocalTypeLabel(label);
  }, [question.type]);

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
              <div className="flex-1 space-y-2">
                <Label>Question</Label>
                <Input
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  onBlur={(e) => {
                  const text = e.target.value;
                            if (text !== question.text) {
                    onUpdate(question._id, { text, type: question.type });
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={localTypeLabel}
                  onValueChange={(label) => {
  const type = QUESTION_TYPE_MAP[label];
  if (type !== question.type) {
    onUpdate(question._id, { 
      type,
      text: localText  // preserve current text
    });
  }
  setLocalTypeLabel(label);
}}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(QUESTION_TYPE_MAP).map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-8">
                <Label htmlFor={`required-${question._id}`}>Required</Label>
                <Switch
                  id={`required-${question._id}`}
                  defaultChecked={question.required}
                  onCheckedChange={(checked) =>
                    onUpdate(question._id, { required: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}