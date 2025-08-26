import AppShell from "@/components/layout/AppShell"
import Wizard from "@/components/reco/Wizard"

export default function RecoPage() {
  return (
    <AppShell breadcrumb={["Home", "Recommendation"]}>
      <div className="max-w-2xl mx-auto mt-6">
        <Wizard />
      </div>
    </AppShell>
  )
}
