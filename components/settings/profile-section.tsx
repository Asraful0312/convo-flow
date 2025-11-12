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

export default function ProfileSection() {
  const user = useQuery(api.auth.loggedInUser);
  const updateUserProfile = useMutation(api.auth.updateUserProfile);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsChanging(true);
    try {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage =
        err instanceof ConvexError
          ? err.data.message || err.data
          : "Failed to change password.";
      toast.error(errorMessage);
    } finally {
      setIsChanging(false);
    }
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
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
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="bg-background"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#F56A4D] hover:bg-[#F56A4D]"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            We'll send a secure code to your email to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetInitiator email={user?.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
