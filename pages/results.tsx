import AppShell from "@/components/layout/AppShell"
import { useState } from "react"
import ProgramCard from "@/components/reco/ProgramCard"
import ProgramModal from "@/components/reco/ProgramModal"
import { evaluateEligibility } from "@/components/reco/eligibility"
import { evaluateConfidence } from "@/components/reco/confidence"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function results() {
  return (
    <AppShell breadcrumb={['Home','results']}>
      
  const [selected, setSelected] = useState<any>(null)
  const programs = [
    { name: "AWS PreSeed", sector: "Tech", location: "AT" },
    { name: "FFG Basisprogramm", sector: "Innovation", location: "AT" },
    { name: "EU Startup Call", sector: "General", location: "EU" }
  ]
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Funding Results</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {programs.map((p, i) => (
          <ProgramCard
            key={i}
            program={p}
            eligibility={evaluateEligibility(p)}
            confidence={evaluateConfidence(p)}
            onClick={() => setSelected(p)}
          />
        ))}
      </div>
      {selected && <ProgramModal program={selected} onClose={() => setSelected(null)} />}
      <div className="pt-6 text-right">
        <Link href="/plan"><Button>Continue to Plan Generator</Button></Link>
      </div>
    </div>
  )

    </AppShell>
  )
}


