import { Card } from "@/components/ui/card"

const plans = [
  { title: "Custom Business Plan", info: "Submission-ready for visa, grants, banks." },
  { title: "Upgrade & Review", info: "Revise drafts, add missing parts, formatting." },
  { title: "Strategy & Modelling Plan", info: "Early-stage idea shaping (4–8 pages)." },
]

export function PlanTypes() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
      {plans.map((p) => (
        <Card key={p.title} className="hover:scale-105 transition">
          <h3 className="font-semibold mb-2">{p.title}</h3>
          <p className="text-sm text-gray-600">{p.info}</p>
        </Card>
      ))}
    </section>
  )
}

export default PlanTypes
