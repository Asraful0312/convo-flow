"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PasswordResetPage() {
  const { signIn } = useAuthActions();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("code", code);
      formData.append("newPassword", newPassword);
      formData.append("flow", "reset-verification");

      await signIn("password", formData);
      toast.success("Password updated successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email) {
    return <p>Missing email. Please start reset from profile.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground">Check your email for the code</p>
      </div>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div>
              <Label>Verification Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="12345678"
                className="placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="placeholder:text-gray-400"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#F56A4D] hover:bg-[#F56A4D]"
            >
              {isSubmitting ? "Updating..." : "Set New Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
