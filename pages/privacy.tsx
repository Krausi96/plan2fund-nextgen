import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p>
        This page describes how we handle your data. (Sample text placeholder).
      </p>
      <Link href="/"><Button>? Back to Home</Button></Link>
    </div>
  )
}
