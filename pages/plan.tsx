import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PlanPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Business Plan Editor</h1>
      <Progress value={30} className="mb-6" />
      <div className="grid grid-cols-4 gap-4">
        <nav className="col-span-1 space-y-2 text-sm">
          <p>Executive Summary</p>
          <p>Products & Services</p>
          <p>Market & Competition</p>
          <p>Financials</p>
        </nav>
        <div className="col-span-3">
          <p className="mb-6">[Editor placeholder here]</p>
          <Link href="/preview"><Button>Continue to Preview</Button></Link>
        </div>
      </div>
    </div>
  )
}
