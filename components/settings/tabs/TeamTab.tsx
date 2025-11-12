"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { MemberActions } from "./MemberActions";

export default function TeamTab() {
  const user = useQuery(api.auth.loggedInUser);
  const workspaceId = user?.activeWorkspace?._id;

  const members = useQuery(
    api.serverQuery.list,
    workspaceId ? { workspaceId } : "skip"
  );

  if (!workspaceId || members === undefined || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentUserMemberInfo = members.find(m => m.userId === user._id);
  const currentUserRole = currentUserMemberInfo?.role;
  const ownerId = user.activeWorkspace?.ownerId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this workspace.
              </CardDescription>
            </div>
            {currentUserRole === 'admin' && <InviteMemberDialog workspaceId={workspaceId} />}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <MemberActions 
                        member={member}
                        isOwner={member.userId === ownerId}
                        currentUserRole={currentUserRole!}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
