import AppShell from "@/components/layout/AppShell";
import OrderSummary from "@/components/checkout/OrderSummary";
import TrustSeals from "@/components/checkout/TrustSeals";

export default function CheckoutPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <OrderSummary />
        <TrustSeals />
      </div>
    </AppShell>
  );
}
