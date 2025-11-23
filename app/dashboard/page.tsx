"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  MessageSquare,
  BarChart2,
  Plus,
  MoreVertical,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import ShareModal from "@/components/share-modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AnimatedStat } from "@/components/dashboard/AnimatedStat";
import { FormCardSkeleton } from "@/components/skeleton/form-card-skeleton";
import { StatCardSkeleton } from "@/components/skeleton/stat-card-skeleton";
import ImportFormModal from "@/components/dashboard/ImportFormModal";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useQuery(api.auth.loggedInUser);
  const router = useRouter();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const activeWorkspace = user?.activeWorkspace;

  console.log("active ", activeWorkspace?._id);

  const forms = useQuery(
    api.forms.getFormsForWorkspace,
    activeWorkspace?._id ? { workspaceId: activeWorkspace._id } : "skip",
  );
  const dashboardStats = useQuery(
    api.forms.getDashboardStats,
    activeWorkspace?._id ? { workspaceId: activeWorkspace._id } : "skip",
  );
  const deleteForm = useMutation(api.forms.deleteForm);

  useEffect(() => {
    if (user === undefined) return; // Still loading
    if (user === null) {
      router.push("/auth/signin"); // Not logged in
      return;
    }
    if (user?.workspaces?.length === 0 || !activeWorkspace) {
      router.push("/dashboard/workspaces/new");
    }
  }, [user, router]);

  const stats =
    dashboardStats === undefined
      ? []
      : [
          {
            title: "Total Forms",
            value: dashboardStats.totalForms,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            title: "Total Responses",
            value: dashboardStats.totalResponses,
            icon: MessageSquare,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            title: "Avg Completion Rate",
            value: `${dashboardStats.avgCompletionRate.toFixed(0)}%`,
            icon: BarChart2,
            color: "text-[#F56A4D]",
            bg: "bg-[#F56A4D]/10",
          },
        ];

  const handleDelete = async (formId: Id<"forms">) => {
    if (!confirm("Delete this form and all its data? This cannot be undone."))
      return;
    await deleteForm({ formId });
  };

  if (
    user === undefined ||
    (user &&
      user?.workspaces &&
      user?.workspaces?.length > 0 &&
      !activeWorkspace)
  ) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {activeWorkspace?.name ?? "Welcome"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {dashboardStats === undefined ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((stat, index) => {
            const isRate =
              typeof stat.value === "string" && stat.value.endsWith("%");
            const numericValue = isRate
              ? parseFloat(stat?.value as string)
              : typeof stat.value === "number"
                ? stat.value
                : 0;
            const textColor = index ===0 ? "text-blue-600": index === 1 ? "text-green-600": index === 2 ? "text-yellow-600": "text-orange-600";

            return (
              <Card
                key={stat.title}
                className={cn("h-full border-0 shadow-sm bg-linear-to-br dark:from-blue-950/20 dark:to-zinc-900", index ===0 ? "from-blue-50 to-white": index === 1 ? "from-green-50 to-white": index === 2 ? "from-yellow-50 to-white": "from-orange-50 to-white ")}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatedStat
                    className={textColor}
                    finalValue={numericValue}
                    suffix={isRate ? "%" : ""}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Forms</h2>
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {forms === undefined && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <FormCardSkeleton key={i} />
            ))}
          </div>
        )}

        {forms && forms.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold">No forms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first form in this workspace.
            </p>
            <Link href="/dashboard/forms/new">
              <Button className="bg-[#F56A4D] hover:bg-[#F56A4D]">
                Create Form
              </Button>
            </Link>
          </div>
        )}

        {forms && forms.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.slice(0, 2).map((form) => (
              <Card
                key={form._id}
                className="bg-white rounded-xl border-[#E9ECF1] hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg group-hover:text-[#F56A4D] transition-colors">
                        <Link href={`/dashboard/forms/${form._id}/edit`}>
                          {form.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {form.description}
                      </CardDescription>
                    </div>
                    <ShareModal formId={form._id} title={form.title} />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex items-center gap-2"
                        asChild
                      >
                        <Button variant="ghost" size="sm" className="">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/f/${form._id}`} passHref>
                          <DropdownMenuItem className="group">
                            <ExternalLink className="w-4 h-4 mr-2 group-hover:text-white" />
                            View Public Form
                          </DropdownMenuItem>
                        </Link>
                        <Link
                          href={`/dashboard/forms/${form._id}/edit`}
                          passHref
                        >
                          <DropdownMenuItem className="group">
                            <Pencil className="w-4 h-4 mr-2 group-hover:text-white" />
                            Edit
                          </DropdownMenuItem>
                        </Link>

                        <DropdownMenuItem
                          onClick={() => handleDelete(form._id)}
                          className="text-destructive group"
                        >
                          <Trash2 className="w-4 h-4 mr-2 text-destructive group-hover:text-white" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {form.responseCount} responses
                  </div>
                </CardContent>
              </Card>
            ))}

            <Link href="/dashboard/forms/new">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 h-full flex items-center justify-center min-h-[200px]">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-full bg-[#F56A4D]/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#F56A4D]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Create New Form</p>
                    <p className="text-sm text-muted-foreground">
                      Start with AI in seconds
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card
              onClick={() => setIsImportModalOpen(true)}
              className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 h-full flex items-center justify-center min-h-[200px]"
            >
              <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Import Form</p>
                  <p className="text-sm text-muted-foreground">
                    Upload PDF or JSON
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="">
        {activeWorkspace && <ActivityFeed workspaceId={activeWorkspace._id} />}
      </div>

      <ImportFormModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(formId) => {
          setIsImportModalOpen(false);
          router.push(`/dashboard/forms/${formId}/edit`);
        }}
      />
    </div>
  );
}
