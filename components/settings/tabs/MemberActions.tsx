"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UnifiedMember } from "@/lib/types";
import { useMutation } from "convex/react";
import { toast } from "sonner";

type Props = {
  member: UnifiedMember;
  isOwner: boolean;
  currentUserRole: "admin" | "editor" | "viewer";
};

export function MemberActions({ member, isOwner, currentUserRole }: Props) {
  const updateRole = useMutation(api.serverMutation.updateRole);
  const removeMember = useMutation(api.serverMutation.removeMember);

  const handleRoleChange = (role: "admin" | "editor" | "viewer") => {
    toast.promise(
      updateRole({
        memberId: member._id as Id<"workspaceMembers"> | Id<"invites">,
        role,
      }),
      {
        loading: "Updating role...",
        success: "Role updated!",
        error: (err) => err.data || "Failed to update role.",
      },
    );
  };

  const handleRemove = () => {
    if (confirm("Are you sure you want to remove this member?")) {
      toast.promise(
        removeMember({
          memberId: member._id as Id<"workspaceMembers"> | Id<"invites">,
          status: member.status,
        }),
        {
          loading: "Removing member...",
          success: "Member removed!",
          error: (err) => err.data || "Failed to remove member.",
        },
      );
    }
  };

  if (currentUserRole !== "admin") {
    return null;
  }

  if (isOwner) {
    return (
      <div className="text-right text-sm text-muted-foreground pr-4">Owner</div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Select onValueChange={handleRoleChange} value={member.role}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="text-destructive hover:text-destructive"
      >
        Remove
      </Button>
    </div>
  );
}
