"use client"

import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare, BarChart2, Plus, MoreVertical, ExternalLink, Pencil, Trash2, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Id } from "@/convex/_generated/dataModel"

export default function DashboardPage() {
  const forms = useQuery(api.forms.getFormsForUser)
  const user = useQuery(api.auth.loggedInUser)
  const deleteForm = useMutation(api.forms.deleteForm)
  const stats = [
    {
      title: "Total Forms",
      value: forms?.length ?? "0",
      icon: FileText,
    },
    {
      title: "Total Responses",
      value: "0", // Placeholder
      icon: MessageSquare,
    },
    {
      title: "Avg Completion Rate",
      value: "0%", // Placeholder
      icon: BarChart2,
    },
  ]

  const handleDelete = async (formId: Id<"forms">) => {
    if (!confirm("Delete this form and all its data? This cannot be undone.")) return
    await deleteForm({ formId })

  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name ?? "..."}</h1>
        <p className="text-muted-foreground">Here's what's happening with your forms today.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
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
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {forms && forms.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold">No forms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by creating your first form.</p>
            <Link href="/dashboard/forms/new">
              <Button className="bg-[#6366f1] hover:bg-[#4f46e5]">Create Form</Button>
            </Link>
          </div>
        )}

        {forms && forms.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.slice(0, 2).map((form) => (
              <Card key={form._id} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg group-hover:text-[#6366f1] transition-colors">
                        <Link href={`/dashboard/forms/${form._id}/edit`}>{form.title}</Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">{form.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/f/${form._id}`} passHref>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Public Form
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/dashboard/forms/${form._id}/edit`} passHref>
                          <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={()=>handleDelete(form._id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2 text-destructive" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">{form.responseCount} responses</div>
                </CardContent>
              </Card>
            ))}

            <Link href="/dashboard/forms/new">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 h-full flex items-center justify-center min-h-[200px]">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#6366f1]" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Create New Form</p>
                    <p className="text-sm text-muted-foreground">Start with AI in seconds</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}