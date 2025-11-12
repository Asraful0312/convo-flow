"use client";

import { useAuthActions } from "@convex-dev/auth/react";

import { toast } from "sonner";
import { useState } from "react";
import { Button } from "./ui/button";

export function PasswordResetInitiator({ email }: { email: string }) {
  const { signIn } = useAuthActions();
  const [isSending, setIsSending] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("No email found.");
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("flow", "reset");

      await signIn("password", formData);
      toast.success(`Password reset code sent to ${email}`);

      window.location.href = `/auth/reset-password?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset code.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click below to receive a secure code to reset your password.
      </p>
      <Button
        onClick={handleReset}
        disabled={isSending || !email}
        className="bg-[#F56A4D] hover:bg-[#F56A4D]"
      >
        {isSending ? "Sending..." : "Send Reset Code"}
      </Button>
    </div>
  );
}
