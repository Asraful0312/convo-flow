import { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  UserPlus,
  LogIn,
  Edit3,
  UserMinus,
  Settings,
} from "lucide-react";

type Props = {
  activity: Doc<"activities"> & { userName: string };
};

function renderIcon(action: string) {
  const iconClass = "w-4 h-4";
  switch (action) {
    case "form.create":
      return <FileText className={iconClass} />;
    case "form.updateStatus":
      return <Edit3 className={iconClass} />;
    case "member.invite":
      return <UserPlus className={iconClass} />;
    case "member.join":
      return <LogIn className={iconClass} />;
    case "member.updateRole":
      return <Settings className={iconClass} />;
    case "member.remove":
      return <UserMinus className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}

function renderDetails(activity: Props["activity"]) {
  const { action, userName, details } = activity;
  return (
    <>
      <span className="font-semibold">{userName}</span>{" "}
      {action === "form.create" && (
        <>
          created the form{" "}
          <span className="font-semibold">{details.title}</span>.
        </>
      )}
      {action === "form.updateStatus" && (
        <>
          updated <span className="font-semibold">{details.title}</span> to{" "}
          <span className="font-semibold">{details.status}</span>.
        </>
      )}
      {action === "member.invite" && (
        <>
          invited <span className="font-semibold">{details.email}</span> as{" "}
          <span className="font-semibold">{details.role}</span>.
        </>
      )}
      {action === "member.join" && <>joined the workspace.</>}
      {action === "member.updateRole" && (
        <>
          changed a member's role to{" "}
          <span className="font-semibold">{details.newRole}</span>.
        </>
      )}
      {action === "member.remove" && <>removed a member from the workspace.</>}
    </>
  );
}

export function ActivityItem({ activity }: Props) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-0.5 p-2 rounded-full bg-[#F56A4D]/10 text-[#F56A4D]">
        {renderIcon(activity.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight">{renderDetails(activity)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(activity.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
