"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CandidLogo from "@/components/shared/candid-logo";
import { ConvexError } from "convex/values";

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const email = formData.get("email") as string;
      
      await signIn("password", {
        flow: "reset",
        email,
      });

      setEmailSent(true);
      // Redirect to the reset page with the email pre-filled
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);

    } catch (error: any) {
      const errorMessage =
        error instanceof ConvexError
          ? error.data
          : "Failed to send reset email. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <CandidLogo />
            <span className="text-2xl font-bold">CANDID</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset code.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          {emailSent ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold">Check your inbox</h2>
              <p className="text-muted-foreground mt-2">
                A password reset code has been sent to your email address. Please
                check your inbox and enter the code on the next page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              
              <Button
                disabled={isLoading}
                className="w-full h-11 bg-[#F56A4D] hover:bg-[#F56A4D]"
              >
                {isLoading ? (
                  <Loader2 className="size-5 shrink-0 animate-spin" />
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link
            href="/auth/signin"
            className="text-[#F56A4D] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
