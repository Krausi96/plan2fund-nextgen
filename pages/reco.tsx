import AppShell from "@/components/layout/AppShell"
import Wizard from "@/components/reco/Wizard"

export default function reco() {
  return (
    <AppShell breadcrumb={['Home','reco']}>
      
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Funding Recommendation Wizard</h1>
      <Wizard />
    </div>
  )

    </AppShell>
  )
}




