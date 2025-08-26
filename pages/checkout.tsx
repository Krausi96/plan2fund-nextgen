import OrderSummary from "@/components/checkout/OrderSummary";
import TrustSeals from "@/components/checkout/TrustSeals";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";

export default function CheckoutPage() {
  const handleCheckout = () => {
    window.location.href = "/export"; // stub: simulate payment success
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <OrderSummary />
        <TrustSeals />
        <Button className="w-full" onClick={handleCheckout}>
          Pay with Stripe (Stub)
        </Button>
      </div>
    </AppShell>
  );
}
