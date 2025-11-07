"use client"

import { useState, useMemo, use } from "react"
import Link from "next/link"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Download,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  Tag,
  Plus,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

export default function ResponsesPage({ params }: { params: { formId: string } }) {
  const { formId } = use<any>(params as any);
  const data = useQuery(api.forms.getResponsesPageData, { formId });
  const user = useQuery(api.auth.loggedInUser)
  const subscription = user?.subscriptionTier || "free"
  const deleteManyResponses = useMutation(api.responses.deleteManyResponses);
  const tagResponses = useMutation(api.responses.tagResponses);
  const exportAction = useAction(api.exports.exportResponses);

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "abandoned">("all")
  const [selectedResponses, setSelectedResponses] = useState<Id<"responses">[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const form = data?.form;
  const responses = data?.responses ?? [];
  const analytics = data?.analytics;

  const filteredResponses = useMemo(() => responses.filter((response: any) => {
    const firstAnswer = response.firstAnswer;
    const searchText = firstAnswer ? String(firstAnswer.value).toLowerCase() : "";

    const matchesSearch =
      searchQuery === "" ||
      response._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchText.includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" || response.status === filterStatus;
    return matchesSearch && matchesFilter;
  }), [responses, searchQuery, filterStatus]);

  const handleSelectResponse = (responseId: Id<"responses">) => {
    setSelectedResponses(prev => 
      prev.includes(responseId) 
        ? prev.filter(id => id !== responseId) 
        : [...prev, responseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedResponses.length === filteredResponses.length) {
      setSelectedResponses([]);
    } else {
      setSelectedResponses(filteredResponses.map((r: any) => r._id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteManyResponses({ responseIds: selectedResponses });
      toast.success("Selected responses deleted successfully");
      setSelectedResponses([]);
    } catch (error) {
      toast.error("Failed to delete responses");
      console.error("Failed to delete responses:", error);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setIsExporting(true);
    if (subscription === "free" && format === "xlsx" || format === "pdf" ) {
      return
    }
    try {
      const url = await exportAction({ formId, responseIds: selectedResponses.length > 0 ? selectedResponses : responses.map((r:any) => r._id), format });
      if (url) {
        window.open(url, '_blank');
        toast.success(`Export started. Your ${format.toUpperCase()} file will be available shortly.`);
      } else {
        toast.error("Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (!device) return <Monitor className="w-4 h-4" />;
    const lowerDevice = device.toLowerCase();
    if (lowerDevice.includes("mobile")) return <Smartphone className="w-4 h-4" />;
    if (lowerDevice.includes("tablet")) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const formatDuration = (started: number, completed?: number) => {
    if (!completed) return "In progress";
    const duration = completed - started;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (date: number) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Form not found or you do not have permission to view it.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forms
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#121316] font-heading">{form?.title}</h1>
            <p className="text-[#2B2F36]">View and manage form responses</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-[#F56A4D] hover:bg-[#E55A3D] text-white">
                  <Download className="w-4 h-4" />
                  Export
                  {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
                <DropdownMenuItem disabled={subscription === "free"} onClick={() => handleExport("xlsx")}>Excel {subscription === "free" && <Badge className="bg-amber-500 text-white"><Lock className="size-4 shrink-0 text-white"/> Pro</Badge>}</DropdownMenuItem>
                <DropdownMenuItem disabled={subscription === "free"} onClick={() => handleExport("pdf")}>PDF {subscription === "free" && <Badge className="bg-amber-500 text-white"><Lock className="size-4 shrink-0 text-white"/> Pro</Badge>}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href={`/f/${formId}`}>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Eye className="w-4 h-4" />
                View Form
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Total Responses</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{analytics?.total ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Completed</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{analytics?.completed ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Completion Rate</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{analytics ? Math.round(analytics.completionRate) : 0}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Avg. Time</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{analytics ? formatDuration(0, analytics.avgCompletionTime) : "0m 0s"}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-subtle">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2B2F36]" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#F7F8FA] border-0"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className={filterStatus === "all" ? "bg-[#F56A4D] hover:bg-[#E55A3D]" : "bg-transparent"}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                  className={filterStatus === "completed" ? "bg-[#F56A4D] hover:bg-[#E55A3D]" : "bg-transparent"}
                >
                  Completed
                </Button>
                <Button
                  variant={filterStatus === "in_progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("in_progress")}
                  className={filterStatus === "in_progress" ? "bg-[#F56A4D] hover:bg-[#E55A3D]" : "bg-transparent"}
                >
                  In Progress
                </Button>
                <Button
                  variant={filterStatus === "abandoned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("abandoned")}
                  className={filterStatus === "abandoned" ? "bg-[#F56A4D] hover:bg-[#E55A3D]" : "bg-transparent"}
                >
                  Abandoned
                </Button>
              </div>
            </div>
            {selectedResponses.length > 0 && (
                <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm text-[#2B2F36]">{selectedResponses.length} selected</span>
                    <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-destructive">Delete Selected</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Tag Selected</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <div className="p-2">
                                <Input placeholder="New tag..." onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        await tagResponses({ responseIds: selectedResponses, tags: [e.currentTarget.value]});
                                        toast.success("Tagged selected responses");
                                    }
                                }} />
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={selectedResponses.length === filteredResponses.length && filteredResponses.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-[#121316] font-semibold">Response ID</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Status</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Tags</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Device</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Duration</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Started</TableHead>
                  <TableHead className="text-right text-[#121316] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response: any) => (
                    <TableRow key={response._id} className={`cursor-pointer hover:bg-[#F0F2F5] ${selectedResponses.includes(response._id) ? 'bg-[#F0F2F5]' : ''}`}>
                      <TableCell onClick={() => handleSelectResponse(response._id)}>
                        <Checkbox checked={selectedResponses.includes(response._id)} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/forms/${formId}/responses/${response._id}`}>
                          <div>
                            <div className="font-medium text-[#121316]">#{response._id.slice(-6)}</div>
                            {response.firstAnswer && <div className="text-sm text-[#2B2F36]">{String(response.firstAnswer.value)}</div>}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            response.status === "completed"
                              ? "bg-[#A3E635] text-[#121316] hover:bg-[#A3E635]"
                              : response.status === "in_progress"
                                ? "bg-[#F59E0B] text-white hover:bg-[#F59E0B]"
                                : "bg-[#FCA5A5] text-[#121316] hover:bg-[#FCA5A5]"
                          }
                        >
                          {response.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {response.tags?.map((tag: any) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[#2B2F36]">
                          {getDeviceIcon(response.metadata?.browser)}
                          <span className="text-sm capitalize">{response.metadata?.browser?.split(" ")[0] || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#2B2F36]">
                        {formatDuration(response.startedAt, response.completedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-[#2B2F36]">
                          <Calendar className="w-4 h-4" />
                          {formatDate(response.startedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/dashboard/forms/${formId}/responses/${response._id}`}>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger><Tag className="w-4 h-4 mr-2" /> Add Tag</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <div className="p-2">
                                        <Input placeholder="New tag..." onKeyDown={async (e) => {
                                            if (e.key === "Enter") {
                                                await tagResponses({ responseIds: [response._id], tags: [e.currentTarget.value]});
                                                toast.success("Tagged response");
                                            }
                                        }} />
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive" 
                              onClick={() => handleBulkDelete()}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredResponses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#2B2F36]">No responses found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}