import AppShell from "@/components/layout/AppShell"
import RevisionRequest from "@/components/thanks/RevisionRequest"
import Upsell from "@/components/thanks/Upsell"

export default function ThanksPage() {
  return (
    <AppShell breadcrumb={["Home", "Thanks"]}>
      <div className="space-y-6">
        <RevisionRequest />
        <Upsell />
      </div>
    </AppShell>
  )
}
