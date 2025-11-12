"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function WorkspaceSwitcher() {
  const user = useQuery(api.auth.loggedInUser);
  const switchWorkspace = useMutation(api.workspaces.switchActive);
  const router = useRouter();

  const handleSwitch = async (workspaceId: string) => {
    toast.loading("Switching workspace...");
    try {
      await switchWorkspace({ workspaceId: workspaceId as any });
      toast.dismiss();
      toast.success("Switched workspace");
      // The dashboard will automatically reload with the new workspace's data
      // due to Convex's reactive queries.
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to switch workspace.");
    }
  };

  if (!user || !user.activeWorkspace) {
    return null; // Or a loading skeleton
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <span className="truncate">{user.activeWorkspace.name}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuGroup>
          {user.workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace._id}
              onClick={() => handleSwitch(workspace._id)}
              className="justify-between"
            >
              <span className="truncate">{workspace.name}</span>
              {workspace._id === user.activeWorkspace?._id && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/workspaces/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
