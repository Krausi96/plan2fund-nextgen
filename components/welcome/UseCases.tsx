import { Card } from "@/components/ui/card"

const cases = [
  { title: "Visa Applications", desc: "RWR, Freelance Permit" },
  { title: "Grants & Public Funding", desc: "AWS PreSeed, EU startup calls" },
  { title: "Bank Loans or Leasing", desc: "Meets financial standards" },
  { title: "Startup & Projects", desc: "Self-employment, consulting support" },
]

export function UseCases() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
      {cases.map((c) => (
        <Card key={c.title} className="hover:shadow-lg transition">
          <h3 className="font-semibold mb-2">{c.title}</h3>
          <p className="text-sm text-gray-600">{c.desc}</p>
        </Card>
      ))}
    </section>
  )
}
