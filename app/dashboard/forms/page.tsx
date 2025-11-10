"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareModal from "@/components/share-modal";
import { ConvexError } from "convex/values";
import { toast } from "sonner";

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft" | "closed"
  >("all");
  const [isLoading, setIsLoading] = useState(false);

  const forms = useQuery(api.forms.getFormsForUser, {
    searchQuery: searchQuery,
    status: filterStatus === "all" ? undefined : filterStatus,
  });
  const deleteForm = useMutation(api.forms.deleteForm);
  const duplicateForm = useMutation(api.forms.duplicateForm);

  const handleDelete = async (formId: Id<"forms">) => {
    if (!confirm("Delete this form and all its data? This cannot be undone."))
      return;
    await deleteForm({ formId });
  };

  const handleDuplicate = async (id: Id<"forms">) => {
    setIsLoading(true);
    try {
      await duplicateForm({ formId: id });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);

      const errorMessage =
        error instanceof ConvexError ? error.data : "Failed to duplicate form!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Forms</h1>
          <p className="text-muted-foreground">
            Manage and create your conversational forms
          </p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 gap-2">
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "outline" : "ghost"}
            onClick={() => setFilterStatus("all")}
          >
            All Forms
          </Button>
          <Button
            variant={filterStatus === "published" ? "outline" : "ghost"}
            onClick={() => setFilterStatus("published")}
          >
            Published
          </Button>
          <Button
            variant={filterStatus === "draft" ? "outline" : "ghost"}
            onClick={() => setFilterStatus("draft")}
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms?.map((form) => (
          <Card
            key={form._id}
            className="bg-white rounded-xl shadow-subtle border-[#E9ECF1] hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {form.title.replace(/ \(Copy\)$/, "")}
                    {form.title.endsWith(" (Copy)") && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        COPY
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {form.description}
                  </CardDescription>
                </div>
                <ShareModal
                  formId={form._id}
                  key={form._id}
                  title={form.title}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="group">
                      <Link
                        className="flex items-center gap-2 group-hover:text-white"
                        href={`/f/${form._id}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-2 group-hover:text-whitw" />
                        View Public Form
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(form._id)}
                      className="group"
                    >
                      {isLoading ? (
                        <Loader2 className="size-4 shrink-0 text-center animate-spin" />
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2 group-hover:text-white" />
                          Duplicate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {form.responseCount}
                  </span>{" "}
                  responses
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    form.status === "published"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {form.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/forms/${form._id}/edit`}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    Edit
                  </Button>
                </Link>
                <Link
                  href={`/dashboard/forms/${form._id}/responses`}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    Responses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
