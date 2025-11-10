import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

export default function NotificationsTab() {
  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose what emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            "New Responses",
            "Weekly Summary",
            "Product Updates",
            "Marketing Emails",
          ].map((label, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">
                  Description here
                </p>
              </div>
              <Switch defaultChecked={i < 2} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
