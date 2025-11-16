"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { ActivityItem } from "./ActivityItem";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Props = {
  workspaceId: Id<"workspaces">;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function ActivityFeed({ workspaceId }: Props) {
  const activities = useQuery(api.activities.listForWorkspace, { workspaceId });
  const role = useQuery(api.users.getRole, { workspaceId });
  const deleteActivity = useMutation(api.activities.deleteActivity);

  const canDelete = role === "admin" || role === "editor";

  const handleDelete = (activityId: Id<"activities">) => {
    toast.promise(deleteActivity({ activityId }), {
      loading: "Deleting activity...",
      success: "Activity deleted!",
      error: "Failed to delete activity.",
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities === undefined && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {activities && activities.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No recent activity.
          </p>
        )}
        {activities && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {activities.map((activity) => (
              <motion.div
                key={activity._id}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center justify-between group"
              >
                <ActivityItem activity={activity} />
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(activity._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity group"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive " />
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
