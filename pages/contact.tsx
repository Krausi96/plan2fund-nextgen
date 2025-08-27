import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p>
        Reach out to us at <a href="mailto:support@plan2fund.com" className="underline">support@plan2fund.com</a>.
      </p>
      <Link href="/"><Button>← Back to Home</Button></Link>
    </div>
  )
}
