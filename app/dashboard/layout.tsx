import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, LayoutDashboard, FileText, BarChart3, Settings, Plus } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ConvoFlow</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/forms">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Forms
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/forms/new">
              <Button size="sm" className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
                <Plus className="w-4 h-4" />
                New Form
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center text-white text-sm font-medium">
              D
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
