import Hero from "@/components/landing/Hero"
import Quote from "@/components/landing/Quote"
import UseCases from "@/components/landing/UseCases"
import PlanTypes from "@/components/landing/PlanTypes"
import Included from "@/components/landing/Included"

export default function LandingPage() {
  return (
    <div className="flex flex-col space-y-16">
      <Hero />
      <Quote />
      <UseCases />
      <PlanTypes />
      <Included />
    </div>
  )
}
