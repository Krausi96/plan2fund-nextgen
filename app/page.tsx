import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-20 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
        <h1 className="text-5xl font-bold mb-6">Freedom starts with a clear plan — let’s build yours.</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Whether you’re shaping an idea, applying for funding or preparing a visa — we turn it into a submission-ready plan.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" variant="default">Find Funding</Button>
          <Button size="lg" variant="secondary">Generate Plan</Button>
        </div>
        {/* TODO: Floating animated objects */}
      </section>

      {/* Quote Block */}
      <section className="max-w-3xl mx-auto text-center text-xl italic">
        <p>“We turn your thoughts, drafts or existing business into a funding-ready Business Plan.”</p>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Visa Applications", desc: "RWR, Freelance Permit" },
          { title: "Grants & Public Funding", desc: "AWS PreSeed, FFG, EU calls" },
          { title: "Bank Loans or Leasing", desc: "Meets financial standards" },
          { title: "Startups & Projects", desc: "Consultants, coaching, early ideas" }
        ].map((item) => (
          <Card key={item.title} className="p-6 hover:shadow-xl transition">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
