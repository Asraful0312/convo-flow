import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { UserCog, Bell, Zap, Webhook, CreditCard, Users } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { LogoIcon } from "./logo-icon";

const links = [
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

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
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
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
