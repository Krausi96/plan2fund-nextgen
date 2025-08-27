import Hero from "@/components/welcome/Hero"
import PlanTypes from "@/components/welcome/PlanTypes"
import UseCases from "@/components/welcome/UseCases"
import QuoteBlock from "@/components/welcome/QuoteBlock"
import WhatsIncluded from "@/components/welcome/WhatsIncluded"

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <Hero />
      <PlanTypes />
      <UseCases />
      <QuoteBlock />
      <WhatsIncluded />
    </main>
  )
}
