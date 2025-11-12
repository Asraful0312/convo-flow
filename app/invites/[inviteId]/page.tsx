"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";
import Link from "next/link";

export default function AcceptInvitePage() {
  const { inviteId } = useParams<{ inviteId: Id<"invites"> }>();
  const invite = useQuery(api.invites.get, { inviteId });
  const accept = useMutation(api.invites.accept);
  const switchWorkspace = useMutation(api.workspaces.switchActive);
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const router = useRouter();

  const handleAccept = async () => {
    toast.promise(
      accept({ inviteId }).then(async ({ workspaceId }) => {
        await switchWorkspace({ workspaceId });
        router.push("/dashboard");
      }),
      {
        loading: "Joining workspace...",
        success: "Successfully joined workspace!",
        error: (err) => err.data || "Failed to join workspace.",
      }
    );
  };

  if (invite === undefined || isAuthLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  if (invite === null) {
    return (
        <div className="h-screen w-full flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Invite Not Found</CardTitle>
                    <CardDescription>
                        This invitation may have expired or been revoked.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You have been invited to join the <strong>{invite.workspaceName}</strong> workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to accept the invitation.
              </p>
              <Button onClick={handleAccept} className="w-full bg-[#F56A4D] hover:bg-[#F56A4D]">
                Accept Invite
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in or create an account to accept this invitation.
              </p>
              <Button asChild className="w-full bg-[#F56A4D] hover:bg-[#F56A4D]">
                <Link href={`/auth/signin?redirect=${encodeURIComponent(`/invites/${inviteId}`)}`}>
                  Sign In to Accept
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
