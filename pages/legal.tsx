import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LegalPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Legal Notice</h1>
      <p>
        Legal information placeholder. Company registration details, addresses, etc.
      </p>
      <Link href="/"><Button>? Back to Home</Button></Link>
    </div>
  )
}


