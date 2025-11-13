"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, BarChart3, Sparkles, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const notifications = [
  {
    label: "New Responses",
    description: "Get notified when someone submits a form",
    icon: Mail,
    defaultChecked: true,
  },
  {
    label: "Weekly Summary",
    description: "Receive a weekly report of form activity",
    icon: BarChart3,
    defaultChecked: true,
  },
  {
    label: "Product Updates",
    description: "Stay up to date with new features and improvements",
    icon: Sparkles,
    defaultChecked: false,
  },
  {
    label: "Marketing Emails",
    description: "Occasional tips, offers, and inspiration",
    icon: Megaphone,
    defaultChecked: false,
  },
];

export default function NotificationsTab() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 w-full max-w-5xl mx-auto"
    >
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F56A4D]/10">
              <Bell className="w-5 h-5 text-[#F56A4D]" />
            </div>
            <div>
              <CardTitle className="text-xl">Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {notifications.map((notif, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 rounded-md bg-[#F56A4D]/5 text-[#F56A4D]">
                  <notif.icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <Label className="text-base font-medium cursor-pointer">
                    {notif.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notif.description}
                  </p>
                </div>
              </div>
              <Switch
                defaultChecked={notif.defaultChecked}
                className="data-[state=checked]:bg-[#F56A4D]"
              />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Optional: Future "Save" button */}
      {/* <div className="flex justify-end">
        <Button className="bg-[#F56A4D] hover:bg-[#F56A4D]/90">
          Save Preferences
        </Button>
      </div> */}
    </motion.div>
  );
}
