import Hero from "@/components/welcome/Hero"
import PlanTypes from "@/components/welcome/PlanTypes"
import UseCases from "@/components/welcome/UseCases"
import QuoteBlock from "@/components/welcome/QuoteBlock"
import WhatsIncluded from "@/components/welcome/WhatsIncluded"
import Link from "next/link"

export default function Home(): JSX.Element {
  return (
    <main className="flex flex-col items-center">
      <Hero />
      <div className="mt-6 flex gap-4">
        <Link href="/reco" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Find Funding</Link>
        <Link href="/plan" className="px-4 py-2 bg-green-600 text-white rounded-lg">Generate Business Plan</Link>
      </div>
      <PlanTypes />
      <UseCases />
      <QuoteBlock />
      <WhatsIncluded />
    </main>
  )
}

