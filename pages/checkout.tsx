import OrderSummary from "@/components/checkout/OrderSummary";
import TrustSeals from "@/components/checkout/TrustSeals";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const handleCheckout = () => {
    alert("Stripe Checkout Stub: Replace with live integration.");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <OrderSummary />
      <TrustSeals />
      <Button className="w-full" onClick={handleCheckout}>
        Pay with Stripe (Test Mode)
      </Button>
    </div>
  );
}
