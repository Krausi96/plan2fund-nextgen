import AppShell from "@/components/layout/AppShell"
import PricingPanel from "@/components/preview/PricingPanel"

export default function PricingPage() {
  return (
    <AppShell breadcrumb={["Home", "Pricing"]}>
      <PricingPanel />
    </AppShell>
  )
}
