import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="text-center py-24 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-4xl font-bold mb-6">
        Freedom starts with a clear plan — let’s build yours.
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        We turn your drafts into funding-ready business plans.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/reco">
          <Button>Find Funding</Button>
        </Link>
        <Link href="/plan">
          <Button variant="outline">Generate Business Plan</Button>
        </Link>
      </div>
    </section>
  )
}
