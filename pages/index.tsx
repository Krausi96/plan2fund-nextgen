import Hero from "@/components/Hero"
import Included from "@/components/home/Included"
import UseCases from "@/components/home/UseCases"
import PlanTypes from "@/components/home/PlanTypes"
import Quote from "@/components/home/Quote"

export default function HomePage() {
  return (
    <div>
      <Hero />
      <div className="mt-10 flex justify-center">
        <a
          href="/ai-plan-machine"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700"
        >
          Start Funding Journey
        </a>
      </div>
      <div className="space-y-16 mt-16">
        <Included />
        <UseCases />
        <PlanTypes />
        <Quote />
      </div>
    </div>
  )
}
