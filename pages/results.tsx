import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ResultsPage() {
  const results = [
    { name: "AWS PreSeed", eligible: true, confidence: "High" },
    { name: "FFG Basisprogramm", eligible: false, confidence: "Low" },
  ]
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Funding Results</h1>
      <div className="space-y-4">
        {results.map(r => (
          <Card key={r.name} className="p-4 flex justify-between">
            <div>
              <h2 className="font-semibold">{r.name}</h2>
              <Badge variant={r.eligible ? "default" : "destructive"}>
                {r.eligible ? "Eligible" : "Not Eligible"}
              </Badge>
              <Badge>{r.confidence} Confidence</Badge>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/plan"><Button>Continue to Plan Generator</Button></Link>
      </div>
    </div>
  )
}
