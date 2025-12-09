"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  FileText,
  LayoutGrid,
  List,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { EmptyForm } from "@/components/empty-form";
import { FormCardSkeleton } from "@/components/skeleton/form-card-skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft" | "closed"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const user = useQuery(api.auth.loggedInUser);
  const router = useRouter();

  // Redirect to workspace creation if user has no workspaces
  useEffect(() => {
    if (user === undefined) return; // Still loading
    if (user === null) {
      router.push("/auth/signin");
      return;
    }
    if (!user.workspaces || user.workspaces.length === 0 || !user.activeWorkspaceId) {
      router.push("/dashboard/workspaces/new");
    }
  }, [user, router]);

  const {
    results: forms,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.forms.getFormsForWorkspace,
    user?.activeWorkspaceId
      ? {
          searchQuery: searchQuery,
          status: filterStatus === "all" ? undefined : filterStatus,
          workspaceId: user.activeWorkspaceId,
        }
      : "skip",
    { initialNumItems: 12 },
  );
  const deleteForm = useMutation(api.forms.deleteForm);
  const duplicateForm = useMutation(api.forms.duplicateForm);

  const handleDelete = async (formId: Id<"forms">) => {
    if (!confirm("Delete this form and all its data? This cannot be undone."))
      return;
    await deleteForm({ formId });
    toast.success("Form deleted successfully");
  };

  const handleDuplicate = async (id: Id<"forms">) => {
    setIsLoading(true);
    try {
      await duplicateForm({ formId: id });
      setIsLoading(false);
      toast.success("Form duplicated successfully");
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof ConvexError ? error.data : "Failed to duplicate form!";
      toast.error(errorMessage);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-[1600px]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Forms</h1>
          <p className="text-muted-foreground">
            Manage and create your conversational forms
          </p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="bg-linear-to-r from-[#F56A4D] to-[#f97316] hover:opacity-90 transition-opacity shadow-md gap-2">
            <Plus className="w-4 h-4" />
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-[#F56A4D]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg">
            {(["all", "published", "draft"] as const).map((status) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "capitalize rounded-md transition-all",
                  filterStatus === status 
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-[#F56A4D]" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-border mx-2 hidden md:block" />
          
          <div className="flex items-center bg-muted/50 p-1 rounded-lg hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-md", viewMode === "grid" && "bg-white dark:bg-zinc-800 shadow-sm")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-md", viewMode === "list" && "bg-white dark:bg-zinc-800 shadow-sm")}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {status === "LoadingFirstPage" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <FormCardSkeleton key={i} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyForm />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid gap-6",
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          )}
        >
          <AnimatePresence>
            {forms.map((form) => (
              <motion.div
                key={form._id}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden",
                  viewMode === "list" && "flex flex-row items-center"
                )}>
                
                  
                  <div className={cn("flex-1", viewMode === "list" ? "flex items-center justify-between p-6" : "")}>
                    <CardHeader className={cn("pb-3", viewMode === "list" && "p-0 w-1/3")}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-[#F56A4D] transition-colors">
                            <Link href={`/dashboard/forms/${form._id}/edit`}>
                              {form.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {form.description || "No description provided"}
                          </CardDescription>
                        </div>
                        {viewMode === "grid" && (
                          <FormActions 
                            form={form} 
                            handleDuplicate={handleDuplicate} 
                            handleDelete={handleDelete} 
                            isLoading={isLoading} 
                          />
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className={cn("pb-3", viewMode === "list" && "p-0 w-1/3 flex justify-center")}>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-medium text-foreground">{form.responseCount}</span>
                          <span className="hidden sm:inline">responses</span>
                        </div>
                      </div>
                      {viewMode !== "list" && <div className="flex gap-2 mt-4">
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
                      </div>}
                    </CardContent>

                    <CardFooter className={cn("pt-0 flex items-center justify-between", viewMode === "list" && "p-0 w-1/3 justify-end gap-4")}>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-medium",
                          form.status === "published" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}
                      >
                        {form.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      
                      {viewMode === "list" ? (
                         <FormActions 
                            form={form} 
                            handleDuplicate={handleDuplicate} 
                            handleDelete={handleDelete} 
                            isLoading={isLoading} 
                          />
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {new Date(form._creationTime).toLocaleDateString()}
                        </div>
                      )}
                    </CardFooter>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {(status === "CanLoadMore" || status === "LoadingMore") && (
            <div className="col-span-full flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => loadMore(12)}
                disabled={status === "LoadingMore"}
              >
                {status === "LoadingMore" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function FormActions({ form, handleDuplicate, handleDelete, isLoading }: any) {
  return (
    <div className="flex items-center gap-1">
      <ShareModal formId={form._id} title={form.title} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/f/${form._id}`} target="_blank">
            <DropdownMenuItem className="group cursor-pointer">
              <ExternalLink className="w-4 h-4 mr-2 group-hover:text-white transition-colors" />
              <span className="group-hover:text-white transition-colors">View Public Form</span>
            </DropdownMenuItem>
          </Link>
          <Link href={`/dashboard/forms/${form._id}/edit`}>
            <DropdownMenuItem className="group cursor-pointer">
              <FileText className="w-4 h-4 mr-2 group-hover:text-white transition-colors" />
              <span className="group-hover:text-white transition-colors">Edit Form</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={() => handleDuplicate(form._id)} className="group cursor-pointer">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin group-hover:text-white transition-colors" />
            ) : (
              <Copy className="w-4 h-4 mr-2 group-hover:text-whtie transition-colors" />
            )}
            <span className="group-hover:text-white transition-colors">Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleDelete(form._id)}
            className="text-red-600 focus:text-red-600 group cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2 group-hover:text-white transition-colors" />
            <span className="group-hover:text-white transition-colors">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
