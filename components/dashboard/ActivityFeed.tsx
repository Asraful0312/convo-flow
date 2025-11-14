"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "./ActivityItem";
import { motion } from "framer-motion";

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
          >
            {activities.map((activity) => (
              <motion.div
                key={activity._id}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="max-h-[200px] overflow-y-scroll"
              >
                <ActivityItem activity={activity} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
