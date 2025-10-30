import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, MoreVertical, Copy, ExternalLink, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockForms } from "@/lib/mock-data"

export default function FormsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Forms</h1>
          <p className="text-muted-foreground">Manage and create your conversational forms</p>
        </div>
        <Link href="/dashboard/forms/new">
          <Button className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
            <Plus className="w-4 h-4" />
            Create Form
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search forms..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">All Forms</Button>
          <Button variant="ghost">Published</Button>
          <Button variant="ghost">Drafts</Button>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockForms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{form.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Form
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
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
              <div className="flex gap-2">
                <Link href={`/dashboard/forms/${form.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Edit
                  </Button>
                </Link>
                <Link href={`/dashboard/forms/${form.id}/responses`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Responses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
