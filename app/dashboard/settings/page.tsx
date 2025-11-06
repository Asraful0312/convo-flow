import SettingsContent from "@/components/page-contents/settigns-content"
import { Suspense } from "react"

export default function SettingsPage() {
 

  return (
    <Suspense fallback='Loading...'>
      <SettingsContent/>
    </Suspense>
  )
}
