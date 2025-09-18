import { Hero } from "@/components/common/Hero"
import { Quote } from "@/components/common/Quote"
import { UseCases } from "@/components/common/UseCases"
import { PlanTypes } from "@/components/common/PlanTypes"
import { Included } from "@/components/common/Included"
import { Advantages } from "@/components/common/Advantages"

export default function Home() {
  return (
    <main className="flex flex-col gap-16">
      <Hero />
      <Quote />
      <UseCases />
      <PlanTypes />
      <Included />
      <Advantages />
    </main>
  )
}
