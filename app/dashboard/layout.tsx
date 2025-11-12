import type React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import CandidLogo from "@/components/shared/candid-logo";
import UserMenu from "@/components/shared/user-menu";
import WorkspaceSwitcher from "@/components/shared/workspace-switcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <CandidLogo />
              <span className="text-xl font-bold">CANDID</span>
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
            <WorkspaceSwitcher />
            <Link href="/dashboard/forms/new">
              <Button
                size="sm"
                className="bg-[#F56A4D] hover:bg-[#F56A4D]/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                New Form
              </Button>
            </Link>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
