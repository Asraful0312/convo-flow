import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import ProfileSection from "@/components/settings/profile-section";

export default function ProfileTab() {
  const { signOut } = useAuthActions();

  return (
    <div className="space-y-6 w-full">
      <ProfileSection />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password fields */}
          <Button onClick={signOut} variant="secondary" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
