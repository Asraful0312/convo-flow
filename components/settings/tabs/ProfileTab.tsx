"use client";

import ProfileSection from "@/components/settings/profile-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { motion } from "framer-motion";
import { Camera, Copy, LogOut, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const BRAND = "#F56A4D";

// ─── SVG Circular Progress Ring ─────────────────────────────────────────────
function ProgressRing({
  progress,
  size = 112,
}: {
  progress: number;
  size?: number;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
      style={{ pointerEvents: "none" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={BRAND}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.15s ease" }}
      />
    </svg>
  );
}

export default function ProfileTab() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getFileUrl);
  const updateUserProfile = useMutation(api.auth.updateUserProfile);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const currentImage = previewUrl ?? user?.image;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get a signed Convex upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file with progress tracking via XHR
      const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result.storageId as Id<"_storage">);
            } catch {
              reject(new Error("Could not parse upload response"));
            }
          } else {
            reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setUploadProgress(100);

      // Step 3: Resolve storageId → public CDN URL
      const publicUrl = await getFileUrl({ storageId });

      if (!publicUrl) throw new Error("Could not get image URL");

      // Step 4: Persist to user profile
      await updateUserProfile({ image: publicUrl });

      // Swap local blob with the real CDN URL
      setPreviewUrl(publicUrl);
      URL.revokeObjectURL(localUrl);

      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Profile picture upload error:", err);
      const msg =
        err instanceof ConvexError
          ? err.data
          : "Upload failed. Please try again.";
      toast.error(msg);
      // Revert preview on error
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 w-full max-w-5xl mx-auto p-1"
    >
      {/* Hero Header – Info */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8"
      >
        {/* Name + Email */}
        <div className="flex flex-col gap-1 items-center">
          <CardContent className="space-y-5">
            {/* Clickable Avatar */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`relative ${isUploading ? "cursor-wait" : "cursor-pointer"} group`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                title="Click to change profile picture"
                role="button"
                aria-label="Change profile picture"
              >
                <Avatar className="w-28 h-28 ring-4 ring-[#F56A4D]/20">
                  <AvatarImage src={currentImage} alt={user?.name} />
                  <AvatarFallback className="text-3xl bg-linear-to-br from-[#F56A4D] to-[#f78b6d] text-white">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Upload progress ring + percentage */}
                {isUploading && (
                  <>
                    <ProgressRing progress={uploadProgress} size={112} />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <span className="text-white text-sm font-bold tabular-nums">
                        {uploadProgress}%
                      </span>
                    </div>
                  </>
                )}

                {/* Hover overlay (idle state) */}
                {!isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-white text-xs mt-1 font-medium tracking-wide">
                      Change
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {isUploading
                  ? `Uploading… ${uploadProgress}%`
                  : "Click your photo to update it"}
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
          <h1 className="text-2xl font-bold text-center">
            {user?.name || "User"}
          </h1>
          <p className="text-muted-foreground text-center">{user?.email}</p>
        </div>

        {/* Info Grid */}
        <div className="flex-1 w-full space-y-4">
          {/* Grid of extra data */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
            {/* Active Workspace */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F56A4D]" />
                <span className="font-medium">
                  {user?.activeWorkspace?.name || "Personal"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-linear-to-r from-[#F56A4D]/5 to-[#F56A4D]/10 border">
              <span className="font-medium capitalize">
                {user?.subscriptionTier || "Free"}
              </span>
              {user?.subscriptionTier === "business" && (
                <Badge className="bg-[#F56A4D] text-white text-xs">Pro</Badge>
              )}
            </div>

            {/* Subscription Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
              <span className="font-medium">Status</span>
              <Badge
                variant={
                  user?.subscriptionStatus === "active"
                    ? "default"
                    : "secondary"
                }
                className={
                  user?.subscriptionStatus === "active"
                    ? "bg-green-600 text-white"
                    : ""
                }
              >
                {user?.subscriptionStatus || "—"}
              </Badge>
            </div>

            {/* Customer ID (copyable) */}
            {user?.stripeCustomerId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground">Cust ID</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    …{user.stripeCustomerId.slice(-6)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(user.stripeCustomerId!);
                      toast.success("Customer ID copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Subscription ID (copyable) */}
            {user?.stripeSubscriptionId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                <span className="text-muted-foreground">Sub ID</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    …{user.stripeSubscriptionId.slice(-6)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(user.stripeSubscriptionId!);
                      toast.success("Subscription ID copied!");
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <ProfileSection />
      </motion.div>

      {/* Security & Sign Out */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F56A4D]" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your password and account access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
