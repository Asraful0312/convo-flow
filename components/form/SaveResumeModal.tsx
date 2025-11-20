"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SaveResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (email: string) => Promise<void>;
}

export default function SaveResumeModal({
  isOpen,
  onClose,
  onSave,
}: SaveResumeModalProps) {
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(email);
      toast.success(
        "A link to resume your session has been sent to your email.",
      );
      onClose();
      setEmail("");
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save your progress</DialogTitle>
          <DialogDescription>
            Enter your email below and we'll send you a link to resume this form
            later from where you left off.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !email}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save and Send Link"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
