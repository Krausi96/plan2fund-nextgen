import CartSummary from "@/components/confirmation/CartSummary";
import DocsUpload from "@/components/confirmation/DocsUpload";
import { Button } from "@/components/ui/button";

export default function ConfirmationPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <CartSummary />
      <DocsUpload />
      <Button asChild>
        <a href="/checkout">Proceed to Checkout</a>
      </Button>
    </div>
  );
}
