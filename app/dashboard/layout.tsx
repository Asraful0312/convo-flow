"use client";
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
import { UserCog, Bell, Zap, Webhook, CreditCard, Users } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useState } from "react";

import { usePathname } from "next/navigation";

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Forms",
    href: "/dashboard/forms",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: "/dashboard/settings?selected=profile",
    icon: <UserCog className="h-5 w-5" />,
  },
  {
    label: "Team",
    href: "/dashboard/settings?selected=team",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Notifications",
    href: "/dashboard/settings?selected=notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Integrations",
    href: "/dashboard/settings?selected=integrations",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    label: "Webhooks",
    href: "/dashboard/settings?selected=webhooks",
    icon: <Webhook className="h-5 w-5" />,
  },
  {
    label: "Billing",
    href: "/dashboard/settings?selected=billing",
    icon: <CreditCard className="h-5 w-5" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className=" bg-background backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <CandidLogo />
              <span className="text-xl font-bold">CANDID</span>
            </Link>
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

      {path !== "/dashboard/forms/new" ? (
        <div className="rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen">
          <div className="rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen">
            <Sidebar open={open} setOpen={setOpen}>
              <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="mt-8 flex flex-col gap-2">
                    {links.map((link, idx) => (
                      <SidebarLink key={idx} link={link} />
                    ))}
                  </div>
                </div>
              </SidebarBody>
            </Sidebar>

            <div className="flex flex-1 h-full">
              <div className="p-2 md:p-6 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}
