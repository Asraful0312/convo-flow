import { Doc } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from 'date-fns';
import { FileText, UserPlus, LogIn, Edit3, UserMinus } from "lucide-react";

type Props = {
    activity: Doc<"activities"> & { userName: string };
}

function renderIcon(action: string) {
    switch(action) {
        case "form.create": return <FileText className="h-4 w-4" />;
        case "form.updateStatus": return <Edit3 className="h-4 w-4" />;
        case "member.invite": return <UserPlus className="h-4 w-4" />;
        case "member.join": return <LogIn className="h-4 w-4" />;
        case "member.updateRole": return <UserPlus className="h-4 w-4" />;
        case "member.remove": return <UserMinus className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
    }
}

function renderDetails(activity: Props["activity"]) {
    const { action, userName, details } = activity;
    switch(action) {
        case "form.create": return <><span className="font-semibold">{userName}</span> created the form <span className="font-semibold">{details.title}</span>.</>;
        case "form.updateStatus": return <><span className="font-semibold">{userName}</span> updated <span className="font-semibold">{details.title}</span> to <span className="font-semibold">{details.status}</span>.</>;
        case "member.invite": return <><span className="font-semibold">{userName}</span> invited <span className="font-semibold">{details.email}</span> as a(n) <span className="font-semibold">{details.role}</span>.</>;
        case "member.join": return <><span className="font-semibold">{userName}</span> joined the workspace.</>;
        case "member.updateRole": return <><span className="font-semibold">{userName}</span> changed a member's role to <span className="font-semibold">{details.newRole}</span>.</>; // TODO: Get user name of updated user
        case "member.remove": return <><span className="font-semibold">{userName}</span> removed a member from the workspace.</>; // TODO: Get user name of removed user
        default: return "An unknown action occurred.";
    }
}


export function ActivityItem({ activity }: Props) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 bg-muted rounded-full p-2">
                {renderIcon(activity.action)}
            </div>
            <div className="flex-1">
                <p className="text-sm">
                    {renderDetails(activity)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
            </div>
        </div>
    )
}
