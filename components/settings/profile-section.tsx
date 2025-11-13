"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Shield, User } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PasswordResetInitiator } from "../PasswordResetInitiator";
import { motion } from "framer-motion";
import { HighlightedTitle } from "@/components/HighlightedTitle";

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function ProfileSection() {
  const user = useQuery(api.auth.loggedInUser);
  const updateUserProfile = useMutation(api.auth.updateUserProfile);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  console.log("user", user);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAvatar(user.image ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({ name, image: avatar });
      toast.success("Profile updated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof ConvexError ? err.data : "Internal Error!";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Profile Information */}
      <motion.div variants={itemVariants} className="md:col-span-1">
        <Card className="h-full border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#F56A4D]" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-background"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#F56A4D] hover:bg-[#F56A4D]/90 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Reset */}
      <motion.div variants={itemVariants} className="md:col-span-1">
        <Card className="h-full border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F56A4D]" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>
              Securely update your password via email
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[calc(100%-5rem)] text-center space-y-4">
            <div className="p-4 rounded-full bg-[#F56A4D]/10">
              <Shield className="w-8 h-8 text-[#F56A4D]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              We'll send a secure reset link to <strong>{user?.email}</strong>
            </p>
            <PasswordResetInitiator email={user?.email ?? ""} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
