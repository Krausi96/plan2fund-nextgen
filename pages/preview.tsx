import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PreviewPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Preview & Pricing</h1>
      <Progress value={60} />
      <Card className="p-4">[Preview content placeholder]</Card>
      <Card className="p-4">[Pricing card placeholder]</Card>
      <Link href="/confirmation"><Button>Proceed to Confirmation</Button></Link>
    </div>
  )
}
