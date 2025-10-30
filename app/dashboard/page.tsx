import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare, TrendingUp, Plus, MoreVertical, ExternalLink, Copy, Trash2, Edit } from "lucide-react"
import { mockForms } from "@/lib/mock-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Forms",
      value: "3",
      change: "+1 this week",
      icon: FileText,
    },
    {
      title: "Total Responses",
      value: "127",
      change: "+23 this week",
      icon: MessageSquare,
    },
    {
      title: "Avg Completion Rate",
      value: "68%",
      change: "+12% vs last month",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, Demo User</h1>
        <p className="text-muted-foreground">Here's what's happening with your forms today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Forms</h2>
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockForms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg group-hover:text-[#6366f1] transition-colors">{form.title}</CardTitle>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/forms/${form.id}/edit`} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Form
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/f/${form.id}`} target="_blank" className="cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Form
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">42</span> responses
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
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Form Card */}
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
      </div>
    </div>
  )
}
