import AppShell from "@/components/layout/AppShell"
import ProgramCard from "@/components/reco/ProgramCard"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { checkEligibility } from "@/components/reco/eligibility"
import { calcConfidence } from "@/components/reco/confidence"

type Program = {
  id: string
  title: string
  description: string
  link: string
}

const mockPrograms: Program[] = [
  { id: "1", title: "Startup Grant", description: "Funding for early-stage startups.", link: "#" },
  { id: "2", title: "SME Innovation", description: "Support for SMEs developing new solutions.", link: "#" },
  { id: "3", title: "Research Excellence", description: "Grants for academic research projects.", link: "#" },
]

export default function ResultsPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    // Normally answers would come from context or Supabase
    const answers = { stage: "startup", location: "AT" }

    // Filter mock programs by eligibility
    const eligible = mockPrograms.filter(p => checkEligibility(p, answers))
    // Add confidence scoring
    const scored = eligible.map(p => ({ ...p, confidence: calcConfidence(p, answers) }))

    setPrograms(scored)
  }, [])

  return (
    <AppShell breadcrumb={["Home", "Recommendation", "Results"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Your recommended funding programs</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {programs.map(p => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
