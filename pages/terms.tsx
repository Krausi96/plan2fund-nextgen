import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <p>
        These are the terms and conditions. (Sample text placeholder).
      </p>
      <Link href="/"><Button>? Back to Home</Button></Link>
    </div>
  )
}
