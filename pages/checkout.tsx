import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckoutPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Checkout (Stub)</h1>
      <Card className="p-4 mb-6">[Order Summary Placeholder]</Card>
      <p className="text-sm text-muted-foreground mb-4">Payment disabled (stub only)</p>
      <Link href="/export"><Button>Continue to Export</Button></Link>
    </div>
  )
}
