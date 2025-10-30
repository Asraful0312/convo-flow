"use client"

import { use, useState } from "react"
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
import { mockForms } from "@/lib/mock-data"

export default function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params)
  const [form] = useState(() => mockForms.find((f) => f.id === formId))
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "abandoned">("all")

  // Mock response data with more details
  const responses = [
    {
      id: "r1",
      respondent: "John Doe",
      email: "john@example.com",
      status: "completed",
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      device: "desktop",
      location: "New York, US",
    },
    {
      id: "r2",
      respondent: "Jane Smith",
      email: "jane@example.com",
      status: "completed",
      started_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
      device: "mobile",
      location: "London, UK",
    },
    {
      id: "r3",
      respondent: "Bob Johnson",
      email: "bob@example.com",
      status: "completed",
      started_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
      device: "tablet",
      location: "Sydney, AU",
    },
    {
      id: "r4",
      respondent: "Anonymous",
      email: "user@example.com",
      status: "in_progress",
      started_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
      device: "mobile",
      location: "Toronto, CA",
    },
  ]

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.respondent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || response.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "desktop":
        return <Monitor className="w-4 h-4" />
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "tablet":
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return "In progress"
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)
    return `${duration} min`
  }

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Form not found</p>
      </div>
    )
  }

  return (
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
          <h1 className="text-3xl font-bold">{form.title}</h1>
          <p className="text-muted-foreground">View and manage form responses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Responses</CardDescription>
            <CardTitle className="text-3xl">42</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">68%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg. Time</CardDescription>
            <CardTitle className="text-3xl">3.2m</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-3xl">+12</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : "bg-transparent"}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("completed")}
                className={filterStatus === "completed" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : "bg-transparent"}
              >
                Completed
              </Button>
              <Button
                variant={filterStatus === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("in_progress")}
                className={filterStatus === "in_progress" ? "bg-[#6366f1] hover:bg-[#4f46e5]" : "bg-transparent"}
              >
                In Progress
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Respondent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResponses.map((response) => (
                <TableRow key={response.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{response.respondent}</div>
                      <div className="text-sm text-muted-foreground">{response.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={response.status === "completed" ? "default" : "secondary"}
                      className={
                        response.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    >
                      {response.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(response.device)}
                      <span className="text-sm capitalize">{response.device}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(response.started_at, response.completed_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {response.completed_at?.toLocaleDateString() || "—"}
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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
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
              ))}
            </TableBody>
          </Table>

          {filteredResponses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No responses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
