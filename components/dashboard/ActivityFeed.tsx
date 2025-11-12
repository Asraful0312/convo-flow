"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "./ActivityItem";

type Props = {
    workspaceId: Id<"workspaces">;
}

export function ActivityFeed({ workspaceId }: Props) {
    const activities = useQuery(api.activities.listForWorkspace, { workspaceId });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities === undefined && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                {activities && activities.length === 0 && <p className="text-sm text-muted-foreground">No recent activity.</p>}
                {activities && activities.map(activity => (
                    <ActivityItem key={activity._id} activity={activity} />
                ))}
            </CardContent>
        </Card>
    )
}
