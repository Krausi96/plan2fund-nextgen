import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConfirmationPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Confirmation</h1>
      <Card className="p-4 mb-6">[Cart Summary Placeholder]</Card>
      <Link href="/checkout"><Button>Proceed to Checkout</Button></Link>
    </div>
  )
}
