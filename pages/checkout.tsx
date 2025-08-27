import { OrderSummary } from "@/components/checkout/OrderSummary"
import { TrustSeals } from "@/components/checkout/TrustSeals"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckoutPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <OrderSummary />
      <TrustSeals />
      <p className="text-sm text-muted-foreground">⚠️ Payment is disabled (stub only)</p>
      <div className="text-right">
        <Link href="/export"><Button>Continue to Export</Button></Link>
      </div>
    </div>
  )
}
