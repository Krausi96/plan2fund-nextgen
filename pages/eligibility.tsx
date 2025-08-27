import AppShell from "@/components/layout/AppShell"
import Eligibility from "@/components/reco/eligibility"

export default function EligibilityPage() {
  return (
    <AppShell breadcrumb={['Home', 'Eligibility']}>
      <div className="p-6">
        <Eligibility />
      </div>
    </AppShell>
  )
}
