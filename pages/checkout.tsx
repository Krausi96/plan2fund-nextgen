import AppShell from "@/components/layout/AppShell"
import OrderSummary from "@/components/checkout/OrderSummary"
import TrustSeals from "@/components/checkout/TrustSeals"

export default function CheckoutPage() {
  return (
    <AppShell breadcrumb={["Home", "Checkout"]}>
      <div className="space-y-6">
        <OrderSummary />
        <TrustSeals />
      </div>
    </AppShell>
  )
}
