"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import CandidLogo from "@/components/shared/candid-logo";

export default function CreateWorkspacePage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createWorkspace = useMutation(api.workspaces.create);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName) {
      toast.error("Workspace name is required.");
      return;
    }
    setIsCreating(true);
    try {
      await createWorkspace({ name: workspaceName });
      toast.success("Workspace created successfully!");
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof ConvexError ? err.data : "Failed to create workspace.";
      toast.error(errorMessage);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <CandidLogo />
          <h1 className="text-3xl font-bold mt-4 mb-2">Create Your Workspace</h1>
          <p className="text-muted-foreground">
            A workspace is where you'll create and manage your forms.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>New Workspace</CardTitle>
            <CardDescription>Give your new workspace a name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g., Marketing Team"
                  required
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full bg-[#F56A4D] hover:bg-[#F56A4D]">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
