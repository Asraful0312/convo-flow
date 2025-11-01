"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
} from "lucide-react"
import { mockForms, mockResponses, mockAnswers } from "@/lib/mock-data"

export default function ResponsesPage({ params }: { params: { formId: string } }) {
  const { formId } = params
  const [form] = useState(() => mockForms.find((f) => f.id === formId))
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "abandoned">("all")

  const responses = mockResponses.filter((r) => r.form_id === formId)

  const filteredResponses = responses.filter((response) => {
    const answers = mockAnswers[response.id] || []
    const firstAnswer = answers[0]
    const searchText = firstAnswer ? String(firstAnswer.value).toLowerCase() : ""

    const matchesSearch =
      searchQuery === "" ||
      response.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchText.includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || response.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "tablet":
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const formatDuration = (started: string, completed?: string) => {
    if (!completed) return "In progress"
    const duration = new Date(completed).getTime() - new Date(started).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const completedCount = responses.filter((r) => r.status === "completed").length
  const completionRate = responses.length > 0 ? Math.round((completedCount / responses.length) * 100) : 0

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Form not found</p>
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
            <h1 className="text-3xl font-bold text-[#121316] font-heading">{form.title}</h1>
            <p className="text-[#2B2F36]">View and manage form responses</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 bg-[#F56A4D] hover:bg-[#E55A3D] text-white">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
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
              <CardTitle className="text-3xl text-[#121316]">{responses.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Completed</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{completedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Completion Rate</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">{completionRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-subtle">
            <CardHeader className="pb-3">
              <CardDescription className="text-[#2B2F36]">Avg. Time</CardDescription>
              <CardTitle className="text-3xl text-[#121316]">2m 15s</CardTitle>
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[#121316] font-semibold">Response ID</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Status</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Device</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Duration</TableHead>
                  <TableHead className="text-[#121316] font-semibold">Started</TableHead>
                  <TableHead className="text-right text-[#121316] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => {
                  const answers = mockAnswers[response.id] || []
                  const firstAnswer = answers[0]

                  return (
                    <TableRow key={response.id} className="cursor-pointer hover:bg-[#F7F8FA]">
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#121316]">#{response.id}</div>
                          {firstAnswer && <div className="text-sm text-[#2B2F36]">{String(firstAnswer.value)}</div>}
                        </div>
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
                        <div className="flex items-center gap-2 text-[#2B2F36]">
                          {getDeviceIcon(response.metadata.device)}
                          <span className="text-sm capitalize">{response.metadata.device || "desktop"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#2B2F36]">
                        {formatDuration(response.started_at, response.completed_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-[#2B2F36]">
                          <Calendar className="w-4 h-4" />
                          {formatDate(response.started_at)}
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
                            <Link href={`/dashboard/forms/${formId}/responses/${response.id}`}>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
