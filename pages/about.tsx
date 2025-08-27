import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p>
        Plan2Fund helps entrepreneurs and businesses create funding-ready business plans.
        Our mission is to make funding more accessible by simplifying the process.
      </p>
      <Link href="/"><Button>? Back to Home</Button></Link>
    </div>
  )
}

