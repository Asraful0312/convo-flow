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
import { Loader2, Users } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function TeamTab() {
  const user = useQuery(api.auth.loggedInUser);
  const workspaceId = user?.activeWorkspace?._id;
  const members = useQuery(
    api.serverQuery.list,
    workspaceId ? { workspaceId } : "skip",
  );

  if (!workspaceId || members === undefined || !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 ml-auto" />
                  <Skeleton className="h-8 w-20 ml-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUserMemberInfo = members.find((m) => m.userId === user._id);
  const currentUserRole = currentUserMemberInfo?.role;
  const ownerId = user.activeWorkspace?.ownerId;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F56A4D]/10">
                <Users className="w-5 h-5 text-[#F56A4D]" />
              </div>
              <div>
                <CardTitle className="text-xl">Team Members</CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? "s" : ""} in
                  this workspace
                </CardDescription>
              </div>
            </div>
            {currentUserRole === "admin" && (
              <InviteMemberDialog workspaceId={workspaceId} />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="pl-6">Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <motion.tr
                  key={member._id}
                  variants={rowVariants}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 ring-2 ring-background">
                        <AvatarImage src={member?.image} />
                        <AvatarFallback className="text-xs bg-linear-to-br from-[#F56A4D] to-[#f78b6d] text-white">
                          {member.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        member.role === "admin"
                          ? "border-[#F56A4D] text-[#F56A4D]"
                          : ""
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <MemberActions
                      member={member}
                      isOwner={member.userId === ownerId}
                      currentUserRole={currentUserRole!}
                    />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
