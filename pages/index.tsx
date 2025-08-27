import { Hero } from "@/components/landing/Hero"
import { Quote } from "@/components/landing/Quote"
import { UseCases } from "@/components/landing/UseCases"
import { PlanTypes } from "@/components/landing/PlanTypes"
import { Included } from "@/components/landing/Included"

export default function Home() {
  return (
    <main className="flex flex-col gap-16">
      <Hero />
      <Quote />
      <UseCases />
      <PlanTypes />
      <Included />
    </main>
  )
}
