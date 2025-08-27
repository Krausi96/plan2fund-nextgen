import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p>
        Our pricing is flexible. Start with a free plan and upgrade as your needs grow.
        (Sample text placeholder).
      </p>
      <Link href="/"><Button>? Back to Home</Button></Link>
    </div>
  )
}

