import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/welcome/Hero"
import { QuoteBlock } from "@/components/welcome/QuoteBlock"
import { UseCases } from "@/components/welcome/UseCases"
import { PlanTypes } from "@/components/welcome/PlanTypes"
import { WhatsIncluded } from "@/components/welcome/WhatsIncluded"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <QuoteBlock />
        <UseCases />
        <PlanTypes />
        <WhatsIncluded />
      </main>
      <Footer />
    </div>
  )
}
