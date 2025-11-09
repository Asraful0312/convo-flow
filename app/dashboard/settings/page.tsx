import SettingsContent from "@/components/page-contents/settigns-content"
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { Suspense } from "react"

export default async function SettingsPage() {
 const preloadedIntegrations = await preloadQuery(api.integrations.getIntegrations);

  return (
    <Suspense fallback='Loading...'>
      <SettingsContent preloadedIntegrations={ preloadedIntegrations} />
    </Suspense>
  )
}
